// setup + should assertions created based on https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/api/data/search", () => {
  afterEach(() => {
    sandBox.restore();
  });

  it("valid response with fake data", (done) => {
    const fakeArticleData = {
      _id: "627341fb4ec0a74b7ab83632",
      keywords: ["test"],
      language: "en",
      link: ["https://www.test.com/test"],
      preview: "test preview",
      published: ["Wed, 04 May 2022 10:27:58 GMT"],
      region: "gb",
      title: ["Test"],
    };

    const responseObject = {
      json: () => ({
        page_num: 1,
        per_page: 10,
        query: "test example",
        results: [fakeArticleData],
        search_from: "",
        search_to: "",
        total_pages: 1,
        total_results: 1,
      }),
    };

    // source: https://stackoverflow.com/questions/43960646/testing-mocking-node-fetch-dependency-that-it-is-used-in-a-class-method
    sandBox.stub(fetch, "Promise").returns(Promise.resolve(responseObject));

    chai.request(server)
      .get("/api/data/search?q=test+example")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("ok").eql(true);
        res.body.should.have.property("data").have.property("page_num").eql(1);
        res.body.should.have.property("data").have.property("per_page").eql(10);
        res.body.should.have.property("data").have.property("query").eql("test example");
        res.body.should.have.property("data").have.property("results");
        res.body.should.have.property("data").have.property("search_from").eql("");
        res.body.should.have.property("data").have.property("search_to").eql("");
        res.body.should.have.property("data").have.property("total_pages").eql(1);
        res.body.should.have.property("data").have.property("total_results").eql(1);
        res.body.should.have.property("data").have.property("results").to.be.an("array")
          .should.contain.an("object");
        res.body.should.have.nested.property("data.results[0]").eql(fakeArticleData);
        done();
      });
  });

  it("fail fetch and throw error", (done) => {
    // source https://stackoverflow.com/questions/39387822/how-to-handle-sinon-stub-throws-in-unit-test-by-sinon-js
    const error = new Error("Test error");
    sandBox.stub(fetch, "Promise").throws(error);

    chai.request(server)
      .get("/api/data/search?q=test+example")
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.have.property("ok").eql(false);
        res.body.should.have.property("msg").eql("Forwarding request to /search failed.");
        done();
      });
  });
});

describe("/api/data/report", () => {
  afterEach(() => {
    sandBox.restore();
  });

  it("valid response with data", (done) => {
    const fakeArticleData = {
      _id: "6239b1eddf4b7decb33fbaf2",
      html: "scraped html",
      keywords: ["Assassination"],
      language: "en",
      link: "https://www.test.com/test",
      published: "2020-01-01",
      region: "gb",
      title: "Test article",
    };

    const responseObject = {
      json: () => ({
        results: [
          fakeArticleData,
        ],
      }),
    };

    sandBox.stub(fetch, "Promise").returns(Promise.resolve(responseObject));

    chai.request(server)
      .get("/api/data/search?ids=[6239b1eddf4b7decb33fbaf2]")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("ok").eql(true);
        res.body.should.have.property("data").have.property("results");
        res.body.should.have.property("data").have.property("results").to.be.an("array")
          .should.contain.an("object");
        res.body.should.have.nested.property("data.results[0]").eql(fakeArticleData);
        done();
      });
  });

  it("fail fetch, throw exception", (done) => {
    const error = new Error("Test error");
    sandBox.stub(fetch, "Promise").throws(error);

    chai.request(server)
      .get("/api/data/report?ids=[fail]")
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.have.property("ok").eql(false);
        res.body.should.have.property("msg").eql("Forwarding request to /report failed.");
        done();
      });
  });
});
