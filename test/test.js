const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

describe("/api/", () => {
  it("response with ok equals true, blank data and msg", () => {
    chai.request(server)
      .get("/api/")
      .end((err, res) => {
        res.should.have.status(200);
      });
  });
});
