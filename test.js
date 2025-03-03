const chai = require('chai');
const chaiHttp = require('chai-http');
const { server } = require('./server');
const ioClient = require('socket.io-client');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Editor Colaborativo', () => {
  before(() => {
    // Iniciar servidor para pruebas si se ha iniciado en pruebas se apagara y se volvera a iniciar
    server.listening && server.close();
    server.listen(3001);
  });

  after(() => {
    // Detener servidor después de pruebas
    server.close();
  });

  describe('API REST', () => {
    it('Debería guardar y recuperar contenido', async () => {
      const testContent = '{"content":"<p>este es otro documento</p>","savedAt":"2025-02-28T16:29:47.302Z"}';
      
      // Guardar contenido
      const saveRes = await chai.request(server)
        .post('/api/rooms/test-room')
        .send({ content: testContent });
      
      expect(saveRes).to.have.status(200);
      expect(saveRes.body).to.have.property('success', true);

      // Recuperar contenido
      const getRes = await chai.request(server)
        .get('/api/rooms/test-room');
      
      expect(getRes).to.have.status(200);
      expect(getRes.body).to.have.property('exists', true);
      expect(getRes.body.content).to.equal(testContent);
    });
  });

});