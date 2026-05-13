import {Inject, Injectable, Logger} from '@nestjs/common';
import {access, readFile} from 'fs/promises';
import * as path from 'path';
import {Agent} from 'https';
import {CERT_DIR} from '@/client/client-model';
import clc from 'cli-color';

@Injectable()
export class CertService {
  private readonly privateKeyPath: string;
  private readonly certificatePath: string;
  private readonly caCertificatePath: string;

  constructor(
    private readonly logger: Logger,
    @Inject(CERT_DIR)
    private readonly certDir: string,
  ) {
    this.privateKeyPath = path.join(this.certDir, 'key.pem');
    this.certificatePath = path.join(this.certDir, 'cert.pem');
    this.caCertificatePath = path.join(this.certDir, 'ca-cert.pem');
  }

  public async checkFilesExist(): Promise<void> {
    const fileList = [
      this.privateKeyPath,
      this.certificatePath,
      this.caCertificatePath,
    ];
    try {
      this.logger.debug(`Checking if certificates files exists ${JSON.stringify(fileList)}`);
      await Promise.all(fileList.map(async(file) => access(file)));
    } catch (error: any) {
      this.logger.error(`Cannot find/load certificate files ${JSON.stringify(fileList)}`);
      throw error;
    }
  }

  public async getHttpAgent(): Promise<Agent> {
    await this.checkFilesExist();
    const [cert, key, ca] = await Promise.all([this.getCert(), this.getPrivateKey(), this.getCaCert()]);
    return new Agent({
      cert,
      key,
      ca,
      rejectUnauthorized: true,
      checkServerIdentity: () => undefined,
    });
  }


  public async getPrivateKey(): Promise<string> {
    this.logger.debug(`Loading private key from ${this.privateKeyPath}`);
    return readFile(this.privateKeyPath, 'utf8');
  }

  public async getCert(): Promise<string> {
    this.logger.debug(`Loading certicate key from ${this.certificatePath}`);
    return readFile(this.certificatePath, 'utf8');
  }

  public async getCaCert(): Promise<string> {
    this.logger.debug(`Loading CA certificate from ${this.caCertificatePath}`);
    const data = await readFile(this.caCertificatePath, 'utf8');
    const lines = data.trim().split('\n');
    // Find the last line that's not the END CERTIFICATE line
    let lastContentLine = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('-----END CERTIFICATE-----')) {
        lastContentLine = lines[i].trim().slice(-4);
        break;
      }
    }
    this.logger.log(`CA cert loaded from ${clc.yellow(this.caCertificatePath)} endswith ${clc.yellow(String(lastContentLine))}`);
    return data;
  }
}
