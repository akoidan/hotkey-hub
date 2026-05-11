import {isOptional, validateType, macroDefinitionVariableValueSchema} from '../src/config/types/local/macro-local-command';

describe('validateType — JSON Schema', () => {
  describe('string', () => {
    it('accepts a string', () => expect(validateType('hello', {type: 'string'})).toBe(true));
    it('accepts empty string', () => expect(validateType('', {type: 'string'})).toBe(true));
    it('rejects a number', () => expect(validateType(42, {type: 'string'})).toBe(false));
    it('rejects undefined', () => expect(validateType(undefined, {type: 'string'})).toBe(false));
  });

  describe('number', () => {
    it('accepts a number', () => expect(validateType(42, {type: 'number'})).toBe(true));
    it('accepts zero', () => expect(validateType(0, {type: 'number'})).toBe(true));
    it('rejects a string', () => expect(validateType('42', {type: 'number'})).toBe(false));
  });

  describe('boolean', () => {
    it('accepts true', () => expect(validateType(true, {type: 'boolean'})).toBe(true));
    it('accepts false', () => expect(validateType(false, {type: 'boolean'})).toBe(true));
    it('rejects a string', () => expect(validateType('true', {type: 'boolean'})).toBe(false));
  });

  describe('any (empty schema {})', () => {
    it('accepts a string', () => expect(validateType('anything', {})).toBe(true));
    it('accepts a number', () => expect(validateType(0, {})).toBe(true));
    it('accepts undefined', () => expect(validateType(undefined, {})).toBe(true));
    it('accepts null', () => expect(validateType(null, {})).toBe(true));
    it('accepts an object', () => expect(validateType({x: 1}, {})).toBe(true));
  });

  describe('union types (anyOf)', () => {
    const stringOrNumber = {anyOf: [{type: 'string'}, {type: 'number'}]};
    it('accepts string', () => expect(validateType('x', stringOrNumber)).toBe(true));
    it('accepts number', () => expect(validateType(1, stringOrNumber)).toBe(true));
    it('rejects boolean', () => expect(validateType(true, stringOrNumber)).toBe(false));

    const stringOrUndefined = {anyOf: [{type: 'string'}, {type: 'null'}]};
    it('accepts string for string|null', () => expect(validateType('hello', stringOrUndefined)).toBe(true));
    it('rejects number for string|null', () => expect(validateType(42, stringOrUndefined)).toBe(false));
  });

  describe('object types', () => {
    const schema = {type: 'object', properties: {x: {type: 'number'}}, required: ['x']};
    it('accepts matching shape', () => expect(validateType({x: 1}, schema)).toBe(true));
    it('rejects wrong property type', () => expect(validateType({x: 'foo'}, schema)).toBe(false));
    it('rejects missing required property', () => expect(validateType({}, schema)).toBe(false));

    const withOptional = {type: 'object', properties: {x: {type: 'number'}, y: {type: 'string'}}};
    it('accepts object with optional property absent', () => expect(validateType({x: 1}, withOptional)).toBe(true));
    it('accepts object with optional property present', () => expect(validateType({x: 1, y: 'hi'}, withOptional)).toBe(true));
  });

  describe('Partial<{...}> equivalent — type:object, no required', () => {
    const schema = {type: 'object', properties: {pp: {}, bish: {}, necro: {}}};
    it('accepts empty object', () => expect(validateType({}, schema)).toBe(true));
    it('accepts partial object', () => expect(validateType({pp: 'anything'}, schema)).toBe(true));
    it('accepts full object with mixed types', () => expect(validateType({pp: 1, bish: 'x', necro: true}, schema)).toBe(true));
    it('rejects non-object', () => expect(validateType('nope', schema)).toBe(false));
  });

  describe('array types', () => {
    it('accepts string[]', () => expect(validateType(['a', 'b'], {type: 'array', items: {type: 'string'}})).toBe(true));
    it('rejects mixed array for string[]', () => expect(validateType(['a', 1], {type: 'array', items: {type: 'string'}})).toBe(false));
    it('accepts empty array', () => expect(validateType([], {type: 'array', items: {type: 'string'}})).toBe(true));
    it('accepts number[]', () => expect(validateType([1, 2, 3], {type: 'array', items: {type: 'number'}})).toBe(true));
    it('accepts array of union', () => {
      expect(validateType(['a', 1], {type: 'array', items: {anyOf: [{type: 'string'}, {type: 'number'}]}})).toBe(true);
    });
  });

  describe('Record<string, T> equivalent — additionalProperties', () => {
    it('accepts matching record', () => {
      expect(validateType({a: 1, b: 2}, {type: 'object', additionalProperties: {type: 'number'}})).toBe(true);
    });
    it('rejects wrong value type', () => {
      expect(validateType({a: 'x'}, {type: 'object', additionalProperties: {type: 'number'}})).toBe(false);
    });
  });

  describe('nested complex types', () => {
    it('accepts nested object', () => {
      expect(validateType({a: {b: {c: 42}}}, {
        type: 'object',
        properties: {a: {type: 'object', properties: {b: {type: 'object', properties: {c: {type: 'number'}}, required: ['c']}}, required: ['b']}},
        required: ['a'],
      })).toBe(true);
    });
    it('rejects nested object with wrong leaf type', () => {
      expect(validateType({a: {b: {c: 'x'}}}, {
        type: 'object',
        properties: {a: {type: 'object', properties: {b: {type: 'object', properties: {c: {type: 'number'}}, required: ['c']}}, required: ['b']}},
        required: ['a'],
      })).toBe(false);
    });
    it('accepts object with array of union types', () => {
      expect(validateType({tags: ['a', 1]}, {
        type: 'object',
        properties: {tags: {type: 'array', items: {anyOf: [{type: 'string'}, {type: 'number'}]}}},
        required: ['tags'],
      })).toBe(true);
    });
  });

  describe('x-optional — ignored by validation itself', () => {
    it('accepts valid value when x-optional is set', () => {
      expect(validateType('hello', {'x-optional': true, type: 'string'})).toBe(true);
    });
    it('rejects invalid value even when x-optional is set', () => {
      expect(validateType(42, {'x-optional': true, type: 'string'})).toBe(false);
    });
    it('empty schema with x-optional accepts anything', () => {
      expect(validateType({complex: 'obj'}, {'x-optional': true})).toBe(true);
    });
  });

  describe('default — ignored by validation itself', () => {
    it('accepts value matching type when default is set', () => {
      expect(validateType(42, {type: 'number', default: 100})).toBe(true);
    });
    it('still rejects invalid value when default is set', () => {
      expect(validateType('x', {type: 'number', default: 100})).toBe(false);
    });
  });

  describe('caching — repeated calls use cached validator', () => {
    const schema = {type: 'string'};
    it('returns same result for same schema object', () => {
      expect(validateType('alpha', schema)).toBe(true);
      expect(validateType('beta', schema)).toBe(true);
      expect(validateType(1, schema)).toBe(false);
    });
  });
});

describe('macroDefinitionVariableValueSchema — rejects old format', () => {
  const parse = (val: unknown) => macroDefinitionVariableValueSchema.safeParse(val);

  it('rejects old "optional" field', () => {
    expect(parse({type: 'string', optional: true}).success).toBe(false);
  });
  it('rejects unknown keyword (typo like type2)', () => {
    expect(parse({type2: 'number'}).success).toBe(false);
  });
  it('rejects old "any" TS type string', () => {
    expect(parse({type: 'any'}).success).toBe(false);
  });
  it('rejects TS union type string', () => {
    expect(parse({type: 'string | undefined'}).success).toBe(false);
  });
  it('accepts valid JSON Schema string type', () => {
    expect(parse({type: 'string'}).success).toBe(true);
  });
  it('accepts empty schema', () => {
    expect(parse({}).success).toBe(true);
  });
  it('accepts schema with x-optional', () => {
    expect(parse({'x-optional': true, type: 'number'}).success).toBe(true);
  });
  it('accepts schema with default', () => {
    expect(parse({type: 'number', default: 0}).success).toBe(true);
  });
  it('accepts complex object schema', () => {
    expect(parse({type: 'object', properties: {pp: {}, bish: {}}, 'x-optional': true}).success).toBe(true);
  });
});

describe('isOptional', () => {
  it('returns true when x-optional is true', () => expect(isOptional({'x-optional': true})).toBe(true));
  it('returns true when x-optional is true alongside type', () => expect(isOptional({'x-optional': true, type: 'string'})).toBe(true));
  it('returns true when default is present', () => expect(isOptional({type: 'number', default: 200})).toBe(true));
  it('returns true when default is null', () => expect(isOptional({default: null})).toBe(true));
  it('returns true when default is 0', () => expect(isOptional({default: 0})).toBe(true));
  it('returns false for required typed schema', () => expect(isOptional({type: 'string'})).toBe(false));
  it('returns false for empty schema', () => expect(isOptional({})).toBe(false));
  it('returns false when x-optional is false', () => expect(isOptional({'x-optional': false})).toBe(false));
});