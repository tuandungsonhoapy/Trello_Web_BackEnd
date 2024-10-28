import streamifier from 'streamifier'
import { env } from '~/config/environment'

import { v2 as cloudinary } from 'cloudinary'

// Configuration
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
})

const streamUpload = (buffer, folderName) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: folderName },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )

    streamifier.createReadStream(buffer).pipe(stream)
  })
}

export const CloudinaryProvider = { streamUpload }
