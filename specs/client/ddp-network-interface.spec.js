/* eslint-disable prefer-arrow-callback, func-names */
/* eslint-env mocha */
import chai from 'chai';
import sinon from 'sinon';
import gql from 'graphql-tag';
import { DDPNetworkInterface } from '../../lib/client/ddp-network-interface';
import { DEFAULT_METHOD } from '../../lib/common/defaults';

describe('#DDPNetworkInterface', function () {
  beforeEach(function (done) {
    this.network = new DDPNetworkInterface();

    Meteor.call('ddp-apollo/setup', done);
  });

  it('should add a default method', function () {
    chai.expect(this.network.method).to.equal(DEFAULT_METHOD);
  });

  describe('#query', function () {
    it('should return a promise', function () {
      chai.expect(this.network.query()).to.be.instanceof(Promise);
    });
  });

  describe('#subscribe', function () {
    it('should return an id and data', function (done) {
      const request = {
        query: gql`subscription { fooSub }`,
      };
      const value = 'bar';

      const network = this.network;
      let subId;

      function handler(err, data) {
        try {
          chai.expect(data).to.deep.equal({ fooSub: value });
          network.unsubscribe(subId);
          done(err);
        } catch (e) {
          done(e);
        }
      }

      subId = this.network.subscribe(request, handler);
      chai.expect(subId).to.be.a('string');

      Meteor.call('ddp-apollo/publish', 'fooSub', value);
    });

    it('should receive multiple updates', function (done) {
      const request = {
        query: gql`subscription { fooSub }`,
      };
      const value = 'bar';

      const dummy = { handler() {} };

      const spy = sinon.spy(dummy, 'handler');

      this.network.subscribe(request, dummy.handler);

      Meteor.call('ddp-apollo/publish', 'fooSub', value);
      Meteor.call('ddp-apollo/publish', 'fooSub', value);
      Meteor.call('ddp-apollo/publish', 'fooSub', value);

      Meteor.setTimeout(() => {
        try {
          chai.expect(spy.callCount).to.equal(3);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);
    });
  });

  describe('#unsubscribe', function () {
    it('should remove the id', function (done) {
      const request = {
        query: gql`subscription { fooSub }`,
      };

      const subId = this.network.subscribe(request);

      chai.expect(this.network.registeredSubscriptions[subId]).to.be.ok;

      setTimeout(() => {
        this.network.unsubscribe(subId);
        chai.expect(this.network.registeredSubscriptions[subId]).to.not.be.ok;
        done();
      }, 10);
    });
  });
});