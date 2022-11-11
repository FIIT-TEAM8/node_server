// // setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

// const sandBox = require("sinon").createSandbox();
// const chai = require("chai");
// const chaiHttp = require("chai-http");
// const jwt = require("jsonwebtoken");
// const db = require("../db/postgres");
// const server = require("../index");

// chai.should();
// chai.use(chaiHttp);

// const error = new Error("");

// describe("/api/report", () => {
//   let mockDb;

//   beforeEach(() => {
//     sandBox.restore();
//     mockDb = sandBox.mock(db);
//   });

//   it("fail getting report from db", async () => {
//     const jwtVerifyStub = sandBox.stub(jwt, "verify");
//     jwtVerifyStub.returns({
//       username: "test123",
//       iat: "test-iat123",
//       id: 1,
//     });
//     mockDb.expects("query").once().resolves({ rows: [] });

//     const res = await chai.request(server)
//       .get("/api/report/1?status=In+Progress")
//       .set("Cookie", "__authToken=test123");

//     res.should.have.status(400);
//     res.body.should.have.property("ok").eql(false);
//     res.body.should.have.property("msg").eql("Unable to retrieve report.");
//     mockDb.verify();
//   });

//   it("fail getting report, throw execption", async () => {
//     const jwtVerifyStub = sandBox.stub(jwt, "verify");
//     jwtVerifyStub.returns({
//       username: "test123",
//       iat: "test-iat123",
//       id: 1,
//     });
//     mockDb.expects("query").once().throws(error);

//     const res = await chai.request(server)
//       .get("/api/report/1")
//       .set("Cookie", "__authToken=test123");

//     res.should.have.status(500);
//     res.body.should.have.property("ok").eql(false);
//     res.body.should.have.property("msg").eql("Unable to retrieve report.");
//     mockDb.verify();
//   });

//   // it("successfully returned report data", async () => {
//   //   const res = await chai.request(server)
//   //     .get("/api/report/1?status=In+Progress")
//   //     .set("Cookie", "__authToken=test123");

//   //   res.should.have.status(200);
//   // });
// });
