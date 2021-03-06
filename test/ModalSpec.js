import jQuery from 'jquery';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import ReactDOM from 'react-dom';
import simulant from 'simulant';

import Modal from '../src/Modal';

import Transition from '../src/Transition';

import { render, shouldWarn } from './helpers';

const $ = componentOrNode => jQuery(ReactDOM.findDOMNode(componentOrNode));

describe('Modal', function () {
  let mountPoint;

  beforeEach(()=>{
    mountPoint = document.createElement('div');
    document.body.appendChild(mountPoint);
  });

  afterEach(function () {
    const unmounted = ReactDOM.unmountComponentAtNode(mountPoint);
    if (unmounted) {
      document.body.removeChild(mountPoint);
    }
  });

  it('Should render the modal content', function() {
    let instance = render(
      <Modal show>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    expect(instance.refs.modal.querySelectorAll('strong').length).to.equal(1);
  });

  it('Should disable scrolling on the modal container while open', function() {
    class Container extends React.Component {
      state = { modalOpen: true };
      handleCloseModal = () => {
        this.setState({ modalOpen: false });
      }
      render() {
        return (
          <div>
            <Modal
              show={this.state.modalOpen}
              onHide={this.handleCloseModal}
              container={this}
            >
              <strong>Message</strong>
            </Modal>
          </div>
        );
      }
    }

    let instance = render(<Container />, mountPoint);
    let modal = ReactTestUtils.findRenderedComponentWithType(instance, Modal);
    let backdrop = modal.backdrop;

    expect($(instance).css('overflow')).to.equal('hidden');

    ReactTestUtils.Simulate.click(backdrop);

    expect($(instance).css('overflow')).to.not.equal('hidden');
  });

  it('Should add and remove container classes', function() {
    class Container extends React.Component {
      state = { modalOpen: true };
      handleCloseModal = () => {
        this.setState({ modalOpen: false });
      }
      render() {
        return (
          <div>
            <Modal
              show={this.state.modalOpen}
              onHide={this.handleCloseModal}
              containerClassName='test test2'
              container={this}
            >
              <strong>Message</strong>
            </Modal>
          </div>
        );
      }
    }

    let instance = render(<Container />, mountPoint);
    let modal = ReactTestUtils.findRenderedComponentWithType(instance, Modal);
    let backdrop = modal.backdrop;

    expect($(instance).hasClass('test test2')).to.be.true;

    ReactTestUtils.Simulate.click(backdrop);

    expect($(instance).hasClass('test test2')).to.be.false;
  });

  it('Should fire backdrop click callback', function () {
    let onClickSpy = sinon.spy();
    let instance = render(
      <Modal show onBackdropClick={onClickSpy}>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    let backdrop = instance.backdrop;

    ReactTestUtils.Simulate.click(backdrop);

    expect(onClickSpy).to.have.been.calledOnce;
  });

  it('Should close the modal when the backdrop is clicked', function (done) {
    let doneOp = function () { done(); };
    let instance = render(
      <Modal show onHide={doneOp}>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    let backdrop = instance.backdrop;

    ReactTestUtils.Simulate.click(backdrop);
  });

  it('Should not close the modal when the "static" backdrop is clicked', function () {
    let onHideSpy = sinon.spy();
    let instance = render(
      <Modal show onHide={onHideSpy} backdrop='static'>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    let backdrop = instance.backdrop;

    ReactTestUtils.Simulate.click(backdrop);

    expect(onHideSpy).to.not.have.been.called;
  });

  it('Should close the modal when the esc key is pressed', function (done) {
    let doneOp = function () { done(); };
    let instance = render(
      <Modal show onHide={doneOp}>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    let backdrop = instance.backdrop;

    simulant.fire(backdrop, 'keyup', { keyCode: 27 });
  });


  it('Should set backdrop Style', function () {

    let instance = render(
      <Modal show className='mymodal' backdrop backdropStyle={{ borderWidth: '3px' }}>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    let backdrop = instance.backdrop;
    expect(
      backdrop.style.borderWidth).to.equal('3px');
  });

  it('Should throw with multiple children', function () {
    expect(function(){
      render(
        <Modal show>
          <strong>Message</strong>
          <strong>Message</strong>
        </Modal>
      , mountPoint);
    }).to.throw(/React.Children.only expected to receive a single React element child./);
  });

  it('Should add role to child', function () {
    let instance = render(
      <Modal show>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    expect(
      instance.getDialogElement().getAttribute('role')).to.equal('document');
  });

  it('Should not add role when SET', function () {
    let instance = render(
      <Modal show>
        <strong role='group'>Message</strong>
      </Modal>
    , mountPoint);

    expect(
      instance.getDialogElement().getAttribute('role')).to.equal('group');
  });

  it('Should not add role when explicitly `null`', function () {
    let instance = render(
      <Modal show>
        <strong role={null}>Message</strong>
      </Modal>
    , mountPoint);

    expect(
      instance.getDialogElement().getAttribute('role')).to.equal(null);
  });

  it('Should unbind listeners when unmounted', function() {
    render(
        <div>
          <Modal show containerClassName='modal-open'>
            <strong>Foo bar</strong>
          </Modal>
        </div>
    , mountPoint);

    assert.ok($(document.body).hasClass('modal-open'));

    render(<div />, mountPoint);

    assert.ok(!$(document.body).hasClass('modal-open'));
  });

  it('Should pass transition callbacks to Transition', function (done) {
    let count = 0;
    let increment = ()=> count++;

    let instance = render(
      <Modal show
        transition={Transition}
        dialogTransitionTimeout={0}
        backdropTransitionTimeout={0}
        onExit={increment}
        onExiting={increment}
        onExited={()=> {
          increment();
          expect(count).to.equal(6);
          done();
        }}
        onEnter={increment}
        onEntering={increment}
        onEntered={()=> {
          increment();
          instance.renderWithProps({ show: false });
        }}
      >
        <strong>Message</strong>
      </Modal>
      , mountPoint);
  });

  it('Should fire show callback on mount', function () {
    let onShowSpy = sinon.spy();
    render(
      <Modal show onShow={onShowSpy}>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    expect(onShowSpy).to.have.been.calledOnce;
  });

  it('Should fire show callback on update', function () {
    let onShowSpy = sinon.spy();
    let instance = render(
      <Modal onShow={onShowSpy}>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    instance.renderWithProps({ show: true });

    expect(onShowSpy).to.have.been.calledOnce;
  });

  it('Should accept role on the Modal', function () {
    let instance = render(
      <Modal role="alertdialog" show>
        <strong>Message</strong>
      </Modal>
    , mountPoint);

    let attr = instance.refs.modal.attributes.getNamedItem('role').value;
    expect(attr).to.equal('alertdialog');
  });

  it('Should accept the `aria-describedby` property on the Modal', function () {

    let instance = render(
      <Modal aria-describedby="modal-description" show>
        <strong id="modal-description">Message</strong>
      </Modal>
    , mountPoint);

    let attr = instance.refs.modal.attributes.getNamedItem('aria-describedby').value;
    expect(attr).to.equal('modal-description');
  });

  describe('Focused state', function () {
    let focusableContainer = null;

    beforeEach(()=>{
      focusableContainer = document.createElement('div');
      focusableContainer.tabIndex = 0;
      focusableContainer.className = 'focus-container';
      document.body.appendChild(focusableContainer);
      focusableContainer.focus();
    });

    afterEach(function () {
      ReactDOM.unmountComponentAtNode(focusableContainer);
      document.body.removeChild(focusableContainer);
    });

    it('Should focus on the Modal when it is opened', function () {

      document.activeElement.should.equal(focusableContainer);

      let instance = render(
        <Modal show>
          <strong className='modal'>Message</strong>
        </Modal>
        , focusableContainer);

      document.activeElement.className.should.contain('modal');

      instance.renderWithProps({ show: false });

      document.activeElement.should.equal(focusableContainer);
    });


    it('Should not focus on the Modal when autoFocus is false', function () {
      render(
        <Modal show autoFocus={false}>
          <strong>Message</strong>
        </Modal>
        , focusableContainer);

      document.activeElement.should.equal(focusableContainer);
    });

    it('Should not focus Modal when child has focus', function () {

      document.activeElement.should.equal(focusableContainer);

      render(
        <Modal show>
          <div className='modal'>
            <input autoFocus/>
          </div>
        </Modal>
        , focusableContainer);

      let input = document.getElementsByTagName('input')[0];

      document.activeElement.should.equal(input);
    });

    it('Should return focus to the modal', () => {
      document.activeElement.should.equal(focusableContainer);

      render(
        <Modal show>
          <div className='modal'>
            <input autoFocus/>
          </div>
        </Modal>
        , focusableContainer);


      focusableContainer.focus();

      document.activeElement.className.should.contain('modal');
    });

    it('Should warn if the modal content is not focusable', function () {
      shouldWarn('The modal content node does not accept focus');

      const Dialog = () => <div />;

      render(
        <Modal show>
          <Dialog />
        </Modal>
        , focusableContainer);
    });
  });

});
