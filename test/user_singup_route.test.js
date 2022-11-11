// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const db = require("../db/postgres");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

const error = new Error("Test error");
const username = "Albert";
const password = "test123";

describe("/user/signup", () => {
  let mockDb;

  const singUpData = JSON.stringify({
    username,
    password,
  });

  beforeEach(() => {
    sandBox.restore();
    mockDb = sandBox.mock(db);
  });

  it("user already exists", (done) => {
    // source: documentation https://sinonjs.org/releases/latest/mocks/#expectations
    mockDb.expects("query").once().resolves({});

    chai.request(server)
      .post("/api/user/signup")
      .send(singUpData)
      .set("Content-Type", "application/json")
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property("ok").eql(false);
        res.body.should.have.property("msg").eql("Sign up failed. Username might already be in use.");
        mockDb.verify();
        done();
      });
  });

  it("successfull singup", (done) => {
    // mock user insert and insert refresh token
    mockDb.expects("query").twice().resolves({ rows: [{ id: 1 }] });

    chai.request(server)
      .post("/api/user/signup")
      .send(singUpData)
      .set("Content-Type", "application/json")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("ok").eql(true);
        res.body.should.have.property("auth").eql(true);
        res.body.should.have.property("msg").eql("Sign up successful.");
        res.body.should.have.property("accessToken");
        res.body.should.have.property("refToken");
        mockDb.verify();
        done();
      });
  });

  it("fail signup, throw execption", (done) => {
    mockDb.expects("query").once().throws(error);

    chai.request(server)
      .post("/api/user/signup")
      .send(singUpData)
      .set("Content-Type", "application/json")
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.have.property("ok").eql(false);
        res.body.should.have.property("msg").eql("Internal server error.");
        mockDb.verify();
        done();
      });
  });
});

// describe("/user/logout", () => {
//   it("", () => {});
// });

// describe("user/token", () => {
//   it("", () => {});
// });
