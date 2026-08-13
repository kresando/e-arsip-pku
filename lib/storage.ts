import fs from "fs/promises";
import path from "path";
import { BlobServiceClient } from "@azure/storage-blob";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export type StorageProvider = "local" | "azure" | "s3";

function getActiveProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || "").toLowerCase();
  
  if (provider === "azure" && process.env.AZURE_STORAGE_CONNECTION_STRING) {
    return "azure";
  }
  if ((provider === "s3" || provider === "r2") && process.env.S3_ACCESS_KEY_ID) {
    return "s3";
  }
  
  return "local";
}

/**
 * Uploads a file buffer or file to the active storage provider.
 * Returns the storage path/key and the filename.
 */
export async function uploadFileToStorage(
  fileBuffer: Buffer,
  originalFileName: string,
  contentType: string = "application/octet-stream"
): Promise<{ filePath: string; fileName: string; provider: StorageProvider }> {
  const provider = getActiveProvider();
  const safeName = `${Date.now()}-${originalFileName.replace(/\s+/g, "_")}`;

  if (provider === "azure") {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "e-arsip-documents";
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: "blob" });

    const blockBlobClient = containerClient.getBlockBlobClient(safeName);
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    return {
      filePath: blockBlobClient.url,
      fileName: originalFileName,
      provider: "azure",
    };
  }

  if (provider === "s3") {
    const region = process.env.S3_REGION || "auto";
    const bucketName = process.env.S3_BUCKET_NAME || "e-arsip-documents";
    const endpoint = process.env.S3_ENDPOINT;

    const s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: safeName,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    const publicUrl = process.env.S3_PUBLIC_DOMAIN
      ? `${process.env.S3_PUBLIC_DOMAIN.replace(/\/$/, "")}/${safeName}`
      : `${endpoint || ""}/${bucketName}/${safeName}`;

    return {
      filePath: publicUrl,
      fileName: originalFileName,
      provider: "s3",
    };
  }

  // Fallback: Local Filesystem Storage (public/uploads)
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, safeName), fileBuffer);

  return {
    filePath: `/uploads/${safeName}`,
    fileName: originalFileName,
    provider: "local",
  };
}

/**
 * Deletes a file from the active storage provider.
 */
export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  const provider = getActiveProvider();

  try {
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      // Azure or S3 URL
      if (provider === "azure" && process.env.AZURE_STORAGE_CONNECTION_STRING) {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "e-arsip-documents";
        
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        const urlParts = new URL(filePath);
        const blobName = path.basename(urlParts.pathname);

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();
        return true;
      }

      if (provider === "s3" && process.env.S3_ACCESS_KEY_ID) {
        const region = process.env.S3_REGION || "auto";
        const bucketName = process.env.S3_BUCKET_NAME || "e-arsip-documents";
        const endpoint = process.env.S3_ENDPOINT;

        const s3Client = new S3Client({
          region,
          endpoint,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          },
        });

        const urlParts = new URL(filePath);
        const blobName = path.basename(urlParts.pathname);

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: blobName,
          })
        );
        return true;
      }
    }

    // Fallback: Local file
    const localPath = path.join(process.cwd(), "public", filePath.startsWith("/") ? filePath.slice(1) : filePath);
    await fs.unlink(localPath);
    return true;
  } catch (err) {
    console.warn("Failed to delete file from storage:", filePath, err);
    return false;
  }
}
