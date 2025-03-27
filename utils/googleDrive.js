const { google } = require("googleapis");
require("dotenv").config();

// Create auth credentials from environment variables
const createAuthCredentials = () => {
  const credentials = {
    type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
  };
  
  return credentials;
};

const auth = new google.auth.GoogleAuth({
  credentials: createAuthCredentials(),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

const uploadToGoogleDrive = async (title, content) => {
  try {
    const fileMetadata = {
      name: `${title}.docx`,
      mimeType: "application/vnd.google-apps.document",
    };

    const media = {
      mimeType: "text/html",
      body: content,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    const fileId = response.data.id;

    // Make file publicly accessible
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return `https://drive.google.com/file/d/${fileId}/view`; // Return public link
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    throw new Error("Failed to upload file to Google Drive");
  }
};


async function deleteFromGoogleDrive(fileId) {
    try {
      await drive.files.delete({ fileId });
      console.log("File deleted from Google Drive:", fileId);
    } catch (error) {
      console.error("Error deleting file from Google Drive:", error);
      throw new Error("Failed to delete file from Google Drive");
    }
  }

module.exports = { uploadToGoogleDrive, deleteFromGoogleDrive };
