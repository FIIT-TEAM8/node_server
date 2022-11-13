// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

const error = new Error("test error");

describe("/api/advanced_search", () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sandBox.stub(fetch, "Promise");
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("/region_mapping valid response", async () => {
    const fakeCrimes = ["crime", "crime"];

    const responseObject = {
      json: () => ({
        category1: fakeCrimes,
        category2: fakeCrimes,
      }),
    };

    fetchStub.resolves(responseObject);

    const res = await chai.request(server)
      .get("/api/advanced_search/region_mapping");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("data").have.property("category1").to.be.an("array").eql(fakeCrimes);
    res.body.should.have.property("data").have.property("category2").to.be.an("array").eql(fakeCrimes);

    sandBox.assert.calledOnce(fetchStub);
  });

  it("/region_mapping fail fetch throw error", async () => {
    fetchStub.throws(error);

    const res = await chai.request(server)
      .get("/api/advanced_search/region_mapping");

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Something went wrong while forwarding the request");

    sandBox.assert.calledOnce(fetchStub);
  });

  it("/keyword_categories valid response", async () => {
    const responseObject = {
      // eslint-disable-next-line quote-props
      json: () => ({ "Slovakia": "sk", "United States": "us" }),
    };

    fetchStub.resolves(responseObject);

    const res = await chai.request(server)
      .get("/api/advanced_search/keyword_categories");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("data").have.property("Slovakia").eql("sk");
    res.body.should.have.property("data").have.property("United States").eql("us");

    sandBox.assert.calledOnce(fetchStub);
  });

  it("/keyword_categories failed fetch throw error", async () => {
    fetchStub.throws(error);

    const res = await chai.request(server)
      .get("/api/advanced_search/keyword_categories");

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Something went wrong while forwarding the request");

    sandBox.assert.calledOnce(fetchStub);
  });
});
