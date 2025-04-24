/**
 * Process a single file and return a promise with the file object
 */
export const processFile = (file: File, columnType: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Create file metadata object
    const fileObject = {
      __type: columnType,
      name: file.name,
      type: file.type,
      size: file.size,
      reference_id: file.name,
    }

    // Convert file to base64 for the 'contents' field
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const base64Content =
          (e.target?.result as string)?.split(',')[1] || ''

        // Add contents to file object
        const fileWithContents = {
          ...fileObject,
          contents: base64Content,
        }

        resolve(fileWithContents)
      } catch (error) {
        console.error('Error processing file:', error)
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    // Read file as data URL
    reader.readAsDataURL(file)
  })
}

/**
 * Process multiple files
 */
export const processFiles = async (
  files: FileList,
  columnType: string
): Promise<any[]> => {
  const filePromises = Array.from(files).map((file) =>
    processFile(file, columnType)
  )
  return Promise.all(filePromises)
}
