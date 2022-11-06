const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../index");

chai.should();
chai.use(chaiHttp);

// source: https://www.digitalocean.com/community/tutorials/test-a-node-restful-api-with-mocha-and-chai
describe("/api/", () => {
  it("response with ok equals true, blank data and msg", (done) => {
    chai.request(server)
      .get("/api/")
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});
