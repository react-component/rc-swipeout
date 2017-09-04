import React from 'react';
import ReactDOM from 'react-dom';
import Gesture from 'rc-gesture';
import omit from 'omit.js';
import classnames from 'classnames';
import SwipeoutPropType from './PropTypes';

export default class Swipeout extends React.Component <SwipeoutPropType, any> {
  static defaultProps = {
    prefixCls: 'rc-swipeout',
    autoClose: false,
    disabled: false,
    left: [],
    right: [],
    onOpen() {},
    onClose() {},
  };

  openedLeft: boolean;
  openedRight: boolean;
  content: any;
  cover: any;
  left: any;
  right: any;
  btnsLeftWidth: number;
  btnsRightWidth: number;
  swiping: boolean;
  needShowLeft: boolean;
  needShowRight: boolean;

  constructor(props) {
    super(props);
    this.state = {
      swiping: false,
    };
    this.openedLeft = false;
    this.openedRight = false;
  }

  componentDidMount() {
    this.btnsLeftWidth = this.left ? this.left.offsetWidth : 0;
    this.btnsRightWidth = this.right ? this.right.offsetWidth : 0;
    document.body.addEventListener('touchstart', this.onCloseSwipe, true);
  }

  componentWillUnmount() {
    document.body.removeEventListener('touchstart', this.onCloseSwipe, true);
  }

  onCloseSwipe = (ev) => {
    if (this.openedLeft || this.openedRight) {
      const pNode = (node => {
        while (node.parentNode && node.parentNode !== document.body) {
          if (node.className.indexOf(`${this.props.prefixCls}-actions`) > -1) {
            return node;
          }
          node = node.parentNode;
        }
      })(ev.target);
      if (!pNode) {
        ev.preventDefault();
        this.close();
      }
    }
  }

  onPanStart = (e) => {
    const { direction, moveStatus } = e;
    const { x: deltaX } = moveStatus;
    // http://hammerjs.github.io/api/#directions
    const isLeft = direction === 2;
    const isRight = direction === 4;

    if (!isLeft && !isRight) {
      return;
    }
    const { left, right } = this.props;
    this.needShowRight = isLeft && right!.length > 0;
    this.needShowLeft = isRight && left!.length > 0;
    if (this.left) {
      this.left.style.visibility = this.needShowRight ? 'hidden' : 'visible';
    }
    if (this.right) {
      this.right.style.visibility = this.needShowLeft ? 'hidden' : 'visible';
    }
    if (this.needShowLeft || this.needShowRight) {
      this.swiping = true;
      this.setState({
        swiping: this.swiping,
      });
      this._setStyle(deltaX);
    }
  }
  onPanMove = (e) => {
    const { moveStatus } = e;
    const { x: deltaX } = moveStatus;
    if (!this.swiping) {
     return;
    }
    this._setStyle(deltaX);
  }

  onPanEnd = (e) => {
    if (!this.swiping) {
      return;
    }

    const { moveStatus } = e;
    const { x: deltaX } = moveStatus;

    const needOpenRight = this.needShowRight && Math.abs(deltaX) > this.btnsRightWidth / 2;
    const needOpenLeft = this.needShowLeft && Math.abs(deltaX) > this.btnsLeftWidth / 2;

    if (needOpenRight) {
      this.doOpenRight();
    } else if (needOpenLeft) {
      this.doOpenLeft();
    } else {
      this.close();
    }
    this.swiping = false;
    this.setState({
      swiping: this.swiping,
    });
    this.needShowLeft = false;
    this.needShowRight = false;
  }

  doOpenLeft = () => {
    this.open(this.btnsLeftWidth, true, false);
  }

  doOpenRight = () => {
    this.open(-this.btnsRightWidth, true, false);
  }
  // left & right button click
  onBtnClick(ev, btn) {
    const onPress = btn.onPress;
    if (onPress) {
      onPress(ev);
    }
    if (this.props.autoClose) {
      this.close();
    }
  }

  _getContentEasing(value, limit) {
    // limit content style left when value > actions width
    const delta = Math.abs(value) - Math.abs(limit);
    const isOverflow = delta > 0;
    const factor = limit > 0 ? 1 : -1;
    if (isOverflow) {
      value = limit + Math.pow(delta, 0.85) * factor;
      return Math.abs(value) > Math.abs(limit) ? limit : value;
    }
    return value;
  }

  // set content & actions style
  _setStyle = (value) => {
    const limit = value > 0 ? this.btnsLeftWidth : -this.btnsRightWidth;
    const contentLeft = this._getContentEasing(value, limit);
    const transform = `translate3d(${contentLeft}px, 0px, 0px)`;
    this.content.style.transform = transform;
    if (this.cover) {
      this.cover.style.display = Math.abs(value) > 0 ? 'block' : 'none';
      this.cover.style.transform = transform;
    }
  }

  open = (value, openedLeft, openedRight) => {
    if (!this.openedLeft && !this.openedRight && this.props.onOpen) {
      this.props.onOpen();
    }

    this.openedLeft = openedLeft;
    this.openedRight = openedRight;
    this._setStyle(value);
  }

  close = () => {
    if ((this.openedLeft || this.openedRight) && this.props.onClose) {
      this.props.onClose();
    }
    this._setStyle(0);
    this.openedLeft = false;
    this.openedRight = false;
  }

  renderButtons(buttons, ref) {
    const prefixCls = this.props.prefixCls;

    return (buttons && buttons.length) ? (
      <div
        className={`${prefixCls}-actions ${prefixCls}-actions-${ref}`}
        ref={(el) => this[ref] = el}
      >
        {
          buttons.map((btn, i) => (
            <div key={i}
              className={`${prefixCls}-btn ${btn.hasOwnProperty('className') ? btn.className : ''}`}
              style={btn.style}
              role="button"
              onClick={(e) => this.onBtnClick(e, btn)}
            >
              <div className={`${prefixCls}-btn-text`}>{btn.text || 'Click'}</div>
            </div>
          ))
        }
      </div>
    ) : null;
  }

  render() {
    const { prefixCls, left, right, disabled, children, ...restProps } = this.props;
    const divProps = omit(restProps, [
      'autoClose',
      'onOpen',
      'onClose',
    ]);

    const refProps = {
      ref: el => this.content = ReactDOM.findDOMNode(el),
    };
    const cls = classnames(prefixCls, {
      [`${prefixCls}-swiping`]: this.state.swiping,
    });
    return (left!.length || right!.length) && !disabled ? (
      <div className={cls} {...divProps}>
        {/* 保证 body touchStart 后不触发 pan */}
        <div className={`${prefixCls}-cover`} ref={(el) => this.cover = el} />
        { this.renderButtons(left, 'left') }
        { this.renderButtons(right, 'right') }
        <Gesture
          onPanStart={this.onPanStart}
          onPanMove={this.onPanMove}
          onPanEnd={this.onPanEnd}
          onSwipeLeft={this.doOpenRight}
          onSwipeRight={this.doOpenLeft}
          direction="horizontal"
          {...refProps}
        >
          <div className={`${prefixCls}-content`}>{children}</div>
        </Gesture>
     </div>
    ) : (
      <div {...refProps} {...divProps}>{children}</div>
    );
  }
}
