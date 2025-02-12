Sure, here's a draft USER_GUIDE.md file for using the NoaVigate Chatbot project:

# NoaVigate Chatbot User Guide

This guide will help you get started with using the NoaVigate Chatbot application after the deployment process is complete.

## Prerequisites

Before you begin, make sure you have the following:

1. A user account created in the Cognito User Pool associated with the application.
2. The user account is added to the appropriate group (e.g., "Admin" group for uploading documents).
3. The Cloudfront URL for accessing the application (available in the output of the CloudFormation stack named "guru-kendra-chatbot").

## Getting Started

1. **Log in to the Application**
   - Open the Cloudfront URL in your web browser.
   - Enter your Cognito user credentials (username and password) to log in.

2. **Upload Documents**
   - After logging in, click on the "Add new documents" button.
   - Click the "Choose files" button and select one or more documents you want to upload.
   - Click "Upload" to upload the selected documents to the S3 bucket.
   - Select the option "Upload to existing folder" and choose the appropriate folder based on the Spanish region.
   - Click "Upload" again to confirm the upload.
   - Close the dialog after the upload is complete.

201. **(Optional) Upload translated docs to their target S3 folders**
   - For now, the document translation is not fully automated. This step must be done manually for document translation to work.
   - Translate the doc that you just uploaded to the target languages using your prefered method. 
   - Go to the AWS Console and navigate to S3. Look for the `guru-kendra-chatbot-kendrainputbucket` and upload each translation according to the language and Spanish region inside the `private` folder.
   - To semiautomate it, we recomend creating a batch Amazon Translate job that translate the docs with a single click, as shown in this blog: https://aws.amazon.com/blogs/machine-learning/translating-documents-with-amazon-translate-aws-lambda-and-the-new-batch-translate-api/


3. **Sync Documents with Kendra**
   - Click the "Sync now" button to initiate a Kendra ingestion job.
   - This job will ingest the uploaded documents into the Kendra index.
   - You can monitor the job status by clicking the "Refresh" button at the bottom of the screen.
   - Wait for the job status to change to "SUCCEEDED" before proceeding.

4. **Start a New Chat**
   - Once the Kendra sync is successful, click the "New chat" menu option.
   - You can now start interacting with the NoaVigate Chatbot by typing your questions or prompts in the chat interface.
   - The chatbot will search the ingested documents and provide relevant responses based on your input.
  
## Common Modifications
1. **Change the model that the common user utilises**
   - Change the **useState** according to the model that you is already within the admin's options and you want the common user to utilise, u¡in the file: `NoaVigate_demo/web-app/src/components/TopBarNavigation.jsx`.
   - Change the **useState** according to the model, **but this time using the id of the model**, in the file: `NoaVigate_demo/web-app/src/pages/Home/Chat.jsx`.
   - Finally, redeploy the solution running the command `npm run build && npm run deploy` inside the `NoaVigate_demo` folder.
  
2. **Add new autonomous communities in Spain**
   - Add a new autonomous communities to the list of Cognito user groups in the file `NoaVigate_demo/deploy/src/constructs/cognito-web-native-construct.ts`.
   - Add the newly created group with its assigned permissions to the Kendra ACL in the file `NoaVigate_demo/deploy/src/app-stack.ts`.
   - Create a folder with the same autonomous community name in the folder `NoaVigate_demo/assets/S3_folders/public` and upload the relevant documents for that community in it.
   - (Optional) Upload the translated version of the documents in the folder `NoaVigate_demo/assets/S3_folders/private/**language**`.
   - Add the new autonomous community name to the **regions** vector inside the file `NoaVigate_demo/deploy.sh`. This will add the newly created folder to the DynamoDB table.
   - Finally, redeploy the solution running the command `npm run build && npm run deploy` inside the `NoaVigate_demo` folder.
  
3. **Add new languages**
   - Add a new language 2 times, in each of the frontend top bars for the admin and the common user in the file `NoaVigate_demo/web-app/src/components/TopBarNavigation.jsx`. You will need to add the **id** in English and the **text** in the selected language so it shows up in the correctly.
   - Add the new language with the desired initial text outputed to the user in the **resetChat** function insite the file `NoaVigate_demo/web-app/src/pages/Home/Chat.jsx`.
   - (Optional) Upload the translated docs in the new language in the folder `NoaVigate_demo/assets/S3_folders/private/**new_laguage**`.
   - Finally, redeploy the solution running the command `npm run build && npm run deploy` inside the `NoaVigate_demo` folder.

## Additional Notes

- **Role-Based Access Control (RBAC)**: The project includes an Access Control List (ACL) template that maps Cognito user groups with S3 key prefixes. This ACL is used to filter search results based on the user's group membership. You can modify the ACL template to suit your organization's security requirements.
- **Supported Document Types**: The project supports document types such as PDF, TXT, HTML, XML, JSON, RTF, PPT, and DOCX (text content only).

If you encounter any issues or have further questions, please refer to the project's README file or consult the project documentation.
