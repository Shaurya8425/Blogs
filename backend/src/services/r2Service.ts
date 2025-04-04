import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class R2Service {
  private client: S3Client;
  private bucketName: string;
  private accountId: string;

  constructor(config: R2Config) {
    if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
      console.error("Missing required R2 configuration:", {
        hasAccountId: !!config.accountId,
        hasAccessKeyId: !!config.accessKeyId,
        hasSecretAccessKey: !!config.secretAccessKey,
        hasBucketName: !!config.bucketName
      });
      throw new Error("Missing required R2 configuration");
    }

    console.log("Initializing R2 client with config:", {
      accountId: config.accountId,
      bucketName: config.bucketName,
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`
    });

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucketName = config.bucketName;
    this.accountId = config.accountId;
  }

  async uploadImage(file: Uint8Array, fileName: string, contentType: string): Promise<string> {
    try {
      console.log('Starting image upload to R2...', {
        bucketName: this.bucketName,
        fileName,
        contentType,
        fileSize: file.length
      });

      const key = `blog-images/${fileName}`;
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read', // Make the object publicly readable
      });

      console.log('Sending upload command to R2...');
      await this.client.send(command);
      console.log('Upload successful!');
      
      // Construct the public URL using the Cloudflare R2 public bucket domain
      // Format: https://<bucket-name>.<account-id>.r2.dev/<key>
      const publicUrl = `https://${this.bucketName}.${this.accountId}.r2.dev/${key}`;
      console.log('Generated public URL:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file to R2:', {
        error,
        bucketName: this.bucketName,
        fileName,
        contentType,
        fileSize: file.length,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
