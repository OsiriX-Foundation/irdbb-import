/* eslint no-console: ["error", { allow: ["info", "warn", "error"] }] */

const http = require('http');

const hostname = '0.0.0.0';
const port = 8080;

const irdbbToken = process.env.IRDBB_TOKEN;
if (!irdbbToken) {
  console.error('Environment variable IRDBB_TOKEN not set');
  return;
}

const semanticTranslator = 'semantictranslator';
const semanticTranslatorPort = 8090;
const semanticTranslatorPath = '/importKheopsSR';

const pacs = 'pacsarc';
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

      if (requestBody.source.capability_token !== undefined
        && requestBody.source.capability_token.id === irdbbToken) {
        console.info('Skipping series sent by the IRDBB token');
        return;
      }

      const updatedStudy = requestBody.updated_study;
      const updatedSeries = updatedStudy.series;

      const studyIntanceUID = updatedStudy.study_uid;

      updatedSeries.forEach((series) => {
        if (series.modality !== 'SR') {
          console.info(`Skipping modality ${series.modality}`);
          return;
        }

        const seriesIntanceUID = series.series_uid;

        const requestOptions = {
          hostname: semanticTranslator,
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
            console.info(`Called Semantic Translator to import DICOM series. (${response.statusCode})`);
            console.info();
            console.info(data);
          });
        }).on('error', (err) => {
          console.info(`Error: ${err.message}`);
        });

        const seriesURL = `http://${pacs}:${pacsPort}${pacsDICOMwebPath}/studies/${studyIntanceUID}/series/${seriesIntanceUID}`;

        console.info(`seriesURL: ${seriesURL}`);

        sendRequest.write(seriesURL);
        sendRequest.end();
      });
    });

    res.statusCode = 204;
    res.end();
  } else {
    res.statusCode = 405;
    res.end();
  }
});

server.listen(port, hostname, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
