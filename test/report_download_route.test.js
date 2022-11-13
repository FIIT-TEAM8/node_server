// setup + inspiration for should assertions: https://stackoverflow.com/questions/46575524/chai-to-test-json-api-output

const sandBox = require("sinon").createSandbox();
const chai = require("chai");
const chaiHttp = require("chai-http");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const htmlToPdf = require("html-pdf-node");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/api/report/download", () => {
  const userId = 1;
  const authToken = "a529a756858f079b7859a246d90644b5";
  const error = new Error("test error");

  const fakeAuthenticatedData = {
    username: "test123",
    iat: "test-iat123",
    id: userId,
  };

  const fakeArticlesInReport = [
    "6240f3e3fcf239665d512756",
    "6240f3e3fcf239665d512756",
  ];

  const fakeSearchTerms = [
    "test1",
    "test2",
  ];

  const fakeResults = {
    results: [
      {
        _id: "6240f3e3fcf239665d512756",
        html: "<h1>test1</h1>",
        keywords: ["Assassination"],
        language: "en",
        link: "https://test.com/",
        published: "2020-01-01",
        region: "gb",
        title: "Fake article number 0",
      },
      {
        _id: "6240f3e3fcf239665d512756",
        html: "<h1>test2</h1>",
        keywords: ["Assassination", "Murder"],
        language: "en",
        link: "https://test.com/",
        published: "2020-01-01",
        region: "gb",
        title: "Fake article number 1",
      },
    ],
  };

  beforeEach(() => {
    sandBox.mock(jwt).expects("verify").once().withArgs(authToken)
      .returns(fakeAuthenticatedData);
  });

  afterEach(() => {
    sandBox.restore();
  });

  it("download failed, because of missing arguments", async () => {
    const res = await chai.request(server)
      .post("/api/report/download")
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ articlesInReport: fakeArticlesInReport }));

    res.should.have.status(400);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Wrong request, missing articles ids or search terms.");
    sandBox.verify();
  });

  it("download failed, because of missing results in data API response", async () => {
    const responseObject = {
      json: () => ({}),
    };

    sandBox.stub(fetch, "Promise").resolves(responseObject);

    const res = await chai.request(server)
      .post("/api/report/download")
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        articlesIds: fakeArticlesInReport,
        articlesSearchTerms: fakeSearchTerms,
      }));

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Articles wasn't recieved from API server.");
    sandBox.verify();
  });

  it("download failed, because request on data API throws error", async () => {
    sandBox.stub(fetch, "Promise").throws(error);

    const res = await chai.request(server)
      .post("/api/report/download")
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        articlesIds: fakeArticlesInReport,
        articlesSearchTerms: fakeSearchTerms,
      }));

    res.should.have.status(500);
    res.body.should.have.property("ok").eql(false);
    res.body.should.have.property("msg").eql("Unable to generate PDF from articles in report.");
    sandBox.verify();
  });

  it("successfully generated and downloaded PDF from articles in report", async () => {
    const responseObject = {
      json: () => (fakeResults),
    };

    sandBox.stub(fetch, "Promise").resolves(responseObject);
    const htmlToPdfMock = sandBox.mock(htmlToPdf);
    htmlToPdfMock.expects("generatePdf").callsFake((file) => {
      const pdfBuffer = Buffer.from(file.content);
      return new Promise((resolve) => {
        resolve(pdfBuffer);
      });
    });

    const res = await chai.request(server)
      .post("/api/report/download")
      .set("Cookie", `__authToken=${authToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        articlesIds: fakeArticlesInReport,
        articlesSearchTerms: fakeSearchTerms,
      }))
      .buffer(); // source: https://github.com/chaijs/chai-http/issues/126

    res.should.have.status(200);
    res.should.have.header("Content-Type", "application/pdf");
    res.body.should.to.be.instanceof(Buffer); // source: https://github.com/chaijs/chai/issues/1028
    sandBox.verify();
  });
});
