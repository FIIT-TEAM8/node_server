// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/api/archive/search", () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sandBox.stub(fetch, "Promise");
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("/archive/search valid response with fake data", async () => {
    const fakeArticleData = {
      _id: "627341fb4ec0a74b7ab83632",
      html: "scraped html",
      keywords: ["test"],
      language: "en",
      link: ["https://www.test.example.com"],
      published: ["Wed, 04 May 2022 10:27:58 GMT"],
      region: "gb",
      title: ["Test"],
    };

    const responseObject = {
      json: () => ({
        article: fakeArticleData,
      }),
    };

    // source: https://stackoverflow.com/questions/43960646/testing-mocking-node-fetch-dependency-that-it-is-used-in-a-class-method
    fetchStub.resolves(responseObject);

    const res = await chai.request(server)
      .get("/api/archive/search?link=https://www.test.example.com");

    res.should.have.status(200);
    res.body.should.have.property("ok").eql(true);
    res.body.should.have.property("msg").eql("Data sent.");
    res.body.should.have.property("data").to.be.an("object").eql(fakeArticleData);

    sandBox.assert.calledOnce(fetchStub);
  });

  it("/archive/search fail fetch throw error", async () => {
    const error = new Error("test error");
    fetchStub.throws(error);

    const res = await chai.request(server)
      .get("/api/archive/search?link=https://www.hello.world.com");

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("The requested article could not be found.");

    sandBox.assert.calledOnce(fetchStub);
  });

  it("/archive/search link parameter not provided", async () => {
    const res = await chai.request(server)
      .get("/api/archive/search");

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("No search parameters provided.");
  });
});
