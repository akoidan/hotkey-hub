/* eslint-disable */
/* Vibe coded ^^ */
import {parse} from '@apidevtools/swagger-parser';
import type {OpenAPI3, OperationObject, PathItemObject, SchemaObject} from 'openapi-typescript';
import {writeFileSync, mkdirSync} from 'fs';
import {dirname, join} from 'path';

interface GeneratorConfig {
  openApiSpecPath: string;
  outputDir: string;
  dtoFileName: string;
  servicesDir: string;
}

interface GeneratedService {
  name: string;
  methods: GeneratedMethod[];
}

interface GeneratedMethod {
  name: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  parameters: ParameterInfo[];
  requestBody?: string;
  responseType: string;
  description?: string;
}

interface ParameterInfo {
  name: string;
  type: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
}

interface GeneratedDto {
  name: string;
  properties: PropertyInfo[];
  isRequest: boolean;
  isResponse: boolean;
}

interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

class OpenApiGenerator {
  private readonly config: GeneratorConfig;
  private api: OpenAPI3;
  private readonly generatedTypes = new Set<string>();
  private readonly generatedServices: GeneratedService[] = [];
  private readonly generatedDtos: GeneratedDto[] = [];

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  async generate(): Promise<void> {
    console.log('Parsing OpenAPI specification...');
    this.api = (await parse(this.config.openApiSpecPath)) as OpenAPI3;

    console.log('Generating types and services...');
    this.generateFromPaths();
    this.generateFromComponents();

    console.log('Writing files...');
    await this.writeDtoFile();
    await this.writeServiceFiles();

    console.log('Generation complete!');
  }

  private generateMethodNameFromPath(path: string, httpMethod?: string): string {
    // Extract method name from path, e.g., /mouse/position -> position
    // /mouse/move-left-click -> moveLeftClick
    // /window/{wid} -> getWindow (get method) or setWindow (patch method)
    // /window/{wid}/focus -> focusWindow
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length === 0) {return 'index';}
    
    // Remove the first segment (module name) and filter out path parameters
    const methodSegments = segments.slice(1).filter(segment => !segment.startsWith('{') && !segment.endsWith('}'));
    
    if (methodSegments.length === 0) {
      // If there are no non-parameter segments, use a default based on the HTTP method
      const moduleName = segments[0];
      switch (httpMethod?.toLowerCase()) {
        case 'get':
          return `get${this.capitalize(moduleName)}`;
        case 'post':
          return `create${this.capitalize(moduleName)}`;
        case 'patch':
        case 'put':
          return `set${this.capitalize(moduleName)}`;
        case 'delete':
          return `delete${this.capitalize(moduleName)}`;
        default:
          return this.capitalize(moduleName);
      }
    }
    
    // Join the remaining segments and convert to camelCase
    const fullPath = methodSegments.join('-');
    return this.toCamelCase(fullPath);
  }

  private generateFromPaths(): void {
    if (!this.api.paths) {return;}

    // Group operations by module name first
    const moduleOperations = new Map<string, { method: string; operation: OperationObject; path: string }[]>();

    for (const [path, pathItem] of Object.entries(this.api.paths)) {
      if (!pathItem) {continue;}

      const operations = this.extractOperations(pathItem, path);
      if (operations.length === 0) {continue;}

      const moduleName = this.extractModuleName(path);
      
      if (!moduleOperations.has(moduleName)) {
        moduleOperations.set(moduleName, []);
      }
      
      moduleOperations.get(moduleName)!.push(...operations);
    }

    // Generate one service per module with all its methods
    for (const [moduleName, operations] of moduleOperations) {
      const service = this.generateService(moduleName, operations);
      this.generatedServices.push(service);
    }
  }

  private extractOperations(pathItem: PathItemObject, path: string): { method: string; operation: OperationObject; path: string }[] {
    const operations: { method: string; operation: OperationObject; path: string }[] = [];

    const httpMethods = ['get', 'post', 'put', 'delete', 'patch'] as const;
    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (operation) {
        operations.push({method: method.toUpperCase(), operation, path});
      }
    }

    return operations;
  }

  private extractModuleName(path: string): string {
    // Extract module name from path, e.g., /mouse/position -> mouse
    const segments = path.split('/').filter(Boolean);
    return segments[0]?.replace(/{.*}/, '') || 'api';
  }

  private generateService(moduleName: string, operations: { method: string; operation: OperationObject; path: string }[]): GeneratedService {
    const methods: GeneratedMethod[] = [];
    const methodNames = new Set<string>();

    for (const {method, operation, path} of operations) {
      const generatedMethod = this.generateMethod(operation, method, path);
      if (generatedMethod) {
        // Handle duplicate method names
        let methodName = generatedMethod.name;
        let counter = 1;
        
        while (methodNames.has(methodName)) {
          // Add suffix to make it unique
          if (path.includes('{')) {
            // If it has path parameters, use By + param name
            const pathParams = generatedMethod.parameters.filter(p => p.in === 'path');
            if (pathParams.length > 0) {
              methodName = `${generatedMethod.name}By${this.capitalize(pathParams[0].name)}`;
            } else {
              methodName = `${generatedMethod.name}${counter}`;
            }
          } else {
            methodName = `${generatedMethod.name}${counter}`;
          }
          counter++;
        }
        
        generatedMethod.name = methodName;
        methodNames.add(methodName);
        methods.push(generatedMethod);
      }
    }

    return {
      name: `${this.capitalize(moduleName)}Service`,
      methods,
    };
  }

  private generateMethod(operation: OperationObject, httpMethod: string, path: string): GeneratedMethod | null {
    // Generate method name from operationId, e.g., WindowController_getWindowBounds -> getWindowBounds
    // Fallback to URL path if operationId is not available
    let methodName: string;
    
    if (operation.operationId) {
      // Convert operationId to camelCase method name
      // WindowController_getWindowBounds -> getWindowBounds
      // KeyboardController_keyPress -> keyPress
      const parts = operation.operationId.split('_');
      if (parts.length >= 2) {
        // Remove controller prefix and convert to camelCase
        methodName = parts.slice(1).join('_');
        methodName = this.toCamelCase(methodName);
      } else {
        methodName = this.toCamelCase(operation.operationId);
      }
    } else {
      // Fallback to URL path-based naming
      methodName = this.generateMethodNameFromPath(path, httpMethod);
    }

    const parameters = this.extractParameters(operation.parameters || []);
    const requestBody = this.extractRequestBody(operation.requestBody);
    const responseType = this.extractResponseType(operation.responses);

    return {
      name: methodName,
      httpMethod: httpMethod as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      path,
      parameters,
      requestBody,
      responseType,
      description: operation.description || operation.summary,
    };
  }

  private extractParameters(parameters: any[]): ParameterInfo[] {
    return parameters.map(param => ({
      name: param.name,
      type: this.mapSchemaToType(param.schema),
      in: param.in,
      required: param.required || false,
    }));
  }

  private extractRequestBody(requestBody: any): string | undefined {
    if (!requestBody?.content) {return undefined;}

    const content = requestBody.content['application/json'];
    if (!content?.schema) {return undefined;}

    return this.generateDtoFromSchema(content.schema, true);
  }

  private extractResponseType(responses: any): string {
    // Try different response codes in order of preference
    const responseCodes = ['200', '201', 'default', '204'];
    
    for (const code of responseCodes) {
      const response = responses[code];
      if (response?.content) {
        const content = response.content['application/json'];
        if (content?.schema) {
          // For array types, return the array type directly
          if (content.schema.type === 'array') {
            const itemType = content.schema.items ? this.mapSchemaToType(content.schema.items) : 'any';
            return `${itemType}[]`;
          }
          return this.generateDtoFromSchema(content.schema, false);
        }
      }
    }
    
    // If no response has content, check for 204 (no content) and return void
    if (responses['204'] || responses['201']) {
      return 'void';
    }
    
    return 'void';
  }

  private generateDtoFromSchema(schema: any, isRequest: boolean): string {
    if (schema.$ref) {
      return this.extractTypeName(schema.$ref);
    }

    if (schema.type === 'object' && schema.properties) {
      const typeName = this.generateTypeName();
      const properties: PropertyInfo[] = [];

      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const prop = propSchema as any;
        properties.push({
          name: propName,
          type: this.mapSchemaToType(prop),
          optional: !schema.required?.includes(propName),
          description: prop.description,
        });
      }

      this.generatedDtos.push({
        name: typeName,
        properties,
        isRequest,
        isResponse: !isRequest,
      });

      return typeName;
    }

    return this.mapSchemaToType(schema);
  }

  private mapSchemaToType(schema: any): string {
    if (!schema) {return 'any';}

    if (schema.$ref) {
      return this.extractTypeName(schema.$ref);
    }

    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        const itemType = schema.items ? this.mapSchemaToType(schema.items) : 'any';
        return `${itemType}[]`;
      case 'object':
        if (schema.properties) {
          // Generate a nested interface for this object
          const typeName = this.generateNestedTypeName();
          const properties: PropertyInfo[] = [];
          
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const prop = propSchema as any;
            properties.push({
              name: propName,
              type: this.mapSchemaToType(prop),
              optional: !schema.required?.includes(propName),
              description: prop.description,
            });
          }
          
          this.generatedDtos.push({
            name: typeName,
            properties,
            isRequest: false,
            isResponse: false,
          });
          
          this.generatedTypes.add(typeName);
          return typeName;
        }
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  private extractTypeName(ref: string): string {
    return ref.split('/').pop() || 'any';
  }

  private generateNestedTypeName(): string {
    const suffix = 'Bounds';
    let counter = 1;
    let typeName: string;

    do {
      typeName = `Generated${counter}${suffix}`;
      counter++;
    } while (this.generatedTypes.has(typeName));

    this.generatedTypes.add(typeName);
    return typeName;
  }

  private generateTypeName(): string {
    const suffix = 'Dto';
    let counter = 1;
    let typeName: string;

    do {
      typeName = `Generated${counter}${suffix}`;
      counter++;
    } while (this.generatedTypes.has(typeName));

    this.generatedTypes.add(typeName);
    return typeName;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private toCamelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  }

  private generateFromComponents(): void {
    if (!this.api.components?.schemas) {return;}

    for (const [schemaName, schema] of Object.entries(this.api.components.schemas)) {
      // Don't add "Dto" suffix if it already exists
      const typeName = schemaName.endsWith('Dto') ? schemaName : `${schemaName}Dto`;
      if (this.generatedTypes.has(typeName)) {continue;}

      const properties = this.extractPropertiesFromSchema(schema as SchemaObject);

      this.generatedDtos.push({
        name: typeName,
        properties,
        isRequest: false,
        isResponse: false,
      });

      this.generatedTypes.add(typeName);
    }
  }

  private extractPropertiesFromSchema(schema: any): PropertyInfo[] {
    if (!schema.properties) {return [];}

    return Object.entries(schema.properties).map(([propName, propSchema]) => {
      const prop = propSchema as any;
      return {
        name: propName,
        type: this.mapSchemaToType(prop),
        optional: !schema.required?.includes(propName),
        description: prop.description,
      };
    });
  }

  private async writeDtoFile(): Promise<void> {
  const outputPath = join(this.config.outputDir, this.config.dtoFileName);
  
  // Ensure directory exists
  mkdirSync(dirname(outputPath), {recursive: true});

  const interfaces: string[] = [];
  for (const dto of this.generatedDtos) {
    const interfaceCode = this.generateInterface(dto);
    interfaces.push(interfaceCode);
  }

  const content = `/* eslint-disable max-lines */
/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */


${interfaces.join('\n\n')}

export type {
${this.generatedDtos.map(dto => `  ${dto.name},`).join('\n')}
};
`;

  writeFileSync(outputPath, content, 'utf8');
  console.log(`Generated DTO file: ${outputPath}`);
}

  private generateInterface(dto: GeneratedDto): string {
    const properties = dto.properties
        .map(prop => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`)
        .join('\n');

    const description = dto.properties.find(p => p.description)?.description;
    const comment = description ? `/**\n * ${description}\n */\n` : '';

    return `${comment}interface ${dto.name} {\n${properties}\n}`;
  }

  private async writeServiceFiles(): Promise<void> {
  const servicesDir = join(this.config.outputDir, this.config.servicesDir);
  
  // Ensure services directory exists
  mkdirSync(servicesDir, {recursive: true});

  for (const service of this.generatedServices) {
    const serviceCode = this.generateServiceCode(service);
    const fileName = `${service.name.toLowerCase().replace('service', '')}.service.ts`;
    const outputPath = join(servicesDir, fileName);
    
    writeFileSync(outputPath, serviceCode, 'utf8');
    console.log(`Generated service file: ${outputPath}`);
  }
}

  private isPrimitiveType(type: string): boolean {
    // Check if type is a primitive type (string, number, boolean, etc.) or array of primitives
    const primitiveTypes = ['string', 'number', 'boolean', 'any'];
    
    // Check for array of primitives (e.g., number[], string[])
    if (type.endsWith('[]')) {
      const baseType = type.slice(0, -2);
      return primitiveTypes.includes(baseType);
    }
    
    return primitiveTypes.includes(type);
  }

  private generateServiceCode(service: GeneratedService): string {
    const imports = new Set<string>();
    imports.add('import {Injectable} from \'@nestjs/common\';');
    imports.add('import {FetchClient} from \'@/client/http-client\';');

    const usedDtos = new Set<string>();

    for (const method of service.methods) {
      if (method.requestBody) {
        usedDtos.add(method.requestBody);
      }
      if (method.responseType !== 'void') {
        // Only add to imports if it's not a primitive type
        if (!this.isPrimitiveType(method.responseType)) {
          usedDtos.add(method.responseType);
        }
      }
    }

    if (usedDtos.size > 0) {
      imports.add(`import {${Array.from(usedDtos).join(', ')}} from '@/client/dtos';`);
    }

    const methods = service.methods.map(method => this.generateMethodCode(method)).join('\n\n');

    return `/** 
 * This code was generated via yarn openapi-client
 * Do not edit it manually
 */
${Array.from(imports).join('\n')}

@Injectable()
export class ${service.name} {
  constructor(private readonly client: FetchClient) {}

${methods}
}
`;
  }

  private generateMethodCode(method: GeneratedMethod): string {
    const params = this.generateMethodParameters(method);
    
    // Handle path in the client call
    let pathCall = method.path;
    const pathParams = method.parameters.filter(p => p.in === 'path');
    
    if (pathParams.length > 0) {
      // Extract parameter names from the path template
      const pathParamNames = [];
      const paramMatches = pathCall.match(/\{([^}]+)\}/g);
      if (paramMatches) {
        for (const match of paramMatches) {
          const paramName = match.slice(1, -1); // Remove { and }
          pathParamNames.push(paramName);
        }
      }
      
      // Replace path parameters with template variables
      for (let i = 0; i < pathParamNames.length && i < pathParams.length; i++) {
        pathCall = pathCall.replace(`{${pathParamNames[i]}}`, `\${${pathParams[i].name}}`);
      }
      pathCall = `\`${pathCall}\``;
    } else {
      pathCall = `'${pathCall}'`;
    }
    
    const clientCall = this.generateClientCall(method);

    return `  async ${method.name}(${params}): Promise<${method.responseType}> {
    return this.client.${method.httpMethod.toLowerCase()}(client, ${pathCall}${clientCall});
  }`;
  }

  private generateMethodParameters(method: GeneratedMethod): string {
    const params: string[] = ['client: string'];

    // Path parameters
    const pathParams = method.parameters.filter(p => p.in === 'path');
    for (const param of pathParams) {
      params.push(`${param.name}: ${param.type}`);
    }

    // Request body
    if (method.requestBody) {
      params.push(`request: ${method.requestBody}`);
    }

    return params.join(', ');
  }

  private generateClientCall(method: GeneratedMethod): string {
    const parts: string[] = [];
    let path = `'${method.path}'`;

    // Handle path parameters by replacing them in the path
    const pathParams = method.parameters.filter(p => p.in === 'path');
    if (pathParams.length > 0) {
      for (const param of pathParams) {
        path = path.replace(`{${param.name}}`, `\${${param.name}}`);
      }
      path = `\`${path}\``;
    }

    // Request body
    if (method.requestBody) {
      return ', request';
    }

    return '';
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: ts-node src/client/generator.ts <openapi-spec-path>');
    console.error('Example: ts-node src/client/generator.ts ./openapi.yaml');
    process.exit(1);
  }

  const specPath = args[0];

  const generator = new OpenApiGenerator({
    openApiSpecPath: specPath,
    outputDir: './src/client', // Output to src/client directly
    dtoFileName: 'dtos.ts',    // Output to src/client/dtos.ts
    servicesDir: 'services',   // Output to src/client/services
  });

  try {
    await generator.generate();
  } catch (error) {
    console.error('Generation failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}
