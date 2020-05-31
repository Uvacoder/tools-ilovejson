import formidable from 'formidable';
import { initDirs } from '@utils/initdir';
import { globals } from '@constants/globals';
import { uploadToFTP } from '@utils/ftp';
const convert = require('xml-js');

const fs = require('fs');
initDirs();

const uploadDir = globals.uploadDir + '/jsontoxml';
const downloadDir = globals.downloadDir + '/jsontoxml';

export const config = {
  api: {
    bodyParser: false,
  },
}

// Process a POST request
export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(403).json({
      success: false,
      message: 'I ❤️ JSON. But you shouldn\'t be here.'
    });
  }

  const form = await new formidable.IncomingForm();
  form.uploadDir = uploadDir;
  form.keepExtensions = true;
  await form.parse(req, async (_err, _fields, files) => {
    if (!(files && files.fileInfo)) {
      return res.status(400).json({
        success: false,
        message: 'I ❤️ JSON. But you forgot to bring something to me.'
      });
    }

    var jsonRead = await fs.readFileSync(files?.fileInfo?.path, 'utf8');

    var options = {compact: true, ignoreComment: true, spaces: 4};
    var xmlOp = await convert.json2xml(jsonRead, options);

    const modifiedDate = new Date().getTime();
    const filePath = `${downloadDir}/${modifiedDate}.xml`;
    await fs.writeFileSync(filePath, xmlOp, 'utf8');

    const toPath = await filePath.replace('dist/downloads/', '');
    await uploadToFTP(filePath, toPath);

    return res.status(200).json({
      success: true,
      message: 'I ❤️ JSON. XML Conversion Successful.',
      data: toPath
    });
  });

}
