/* eslint no-console: ["error", { allow: ["info", "warn", "error"] }] */

const http = require('http');

const hostname = '0.0.0.0';
const port = 8080;

const semanticTranslator = 'semantictranslator';
const semanticTranslatorPort = 8080;
const semanticTranslatorPath = 'importKheopsSR';

const pacs = 'semantictranslator';
const pacsPort = 8080;
const pacsDICOMwebPath = '/dcm4chee-arc/aets/DCM4CHEE/rs';

const server = http.createServer((request, res) => {
  if (request.method === 'POST') {
    console.info(`request for ${request.url}`);

    const bodyData = [];
    request.on('data', (chunk) => {
      bodyData.push(chunk);
    });
    request.on('end', () => {
      const requestBody = JSON.parse(bodyData);
      const updatedStudy = requestBody.updated_study.series;
      const updatedSeries = requestBody.updated_study.series;

      const studyIntanceUID = updatedStudy.study_uid;

      updatedSeries.forEach((series) => {
        const seriesIntanceUID = series.series_uid;

        const requestOptions = {
          host: semanticTranslator,
          port: semanticTranslatorPort,
          path: semanticTranslatorPath,
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
        };

        const sendRequest = http.request(requestOptions, (response) => {
          let data = '';

          response.on('data', (chunk) => {
            data += chunk;
          });

          response.on('end', () => {
            console.info(`Called Semantic Translator to import DICOM series. (${res.statusCode})`);
            console.info();
            console.info(data);
          });
        }).on('error', (err) => {
          console.info(`Error: ${err.message}`);
        });

        const seriesURL = `${pacs}:${pacsPort}//${pacsDICOMwebPath}/studies/${studyIntanceUID}/series/${seriesIntanceUID}`; 

        sendRequest.write(seriesURL);
        sendRequest.end();
      });
    });
  }
});

server.listen(port, hostname, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
