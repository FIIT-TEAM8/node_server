// setup and /api test created based on https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const fetch = require("node-fetch");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/api/", () => {
  it("response with ok equals true, blank data and msg", (done) => {
    chai.request(server)
      .get("/api/")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("ok").eql(true);
        res.body.should.have.property("data").eql({});
        res.body.should.have.property("msg").eql("Default api route. Ok.");
        done();
      });
  });
});

describe("/api/data/search", () => {
  it("response with data", (done) => {
    const responseObject = {
      json: () => ({ hello: "hello" }),
    };
    // source: https://stackoverflow.com/questions/43960646/testing-mocking-node-fetch-dependency-that-it-is-used-in-a-class-method
    sinon.stub(fetch, "Promise").returns(Promise.resolve(responseObject));

    chai.request(server)
      .get("/api/data/search?q=donald+trump")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("ok").eql(true);
        res.body.should.have.property("data").have.property("hello").eql("hello");
        done();
      });
  });
});
