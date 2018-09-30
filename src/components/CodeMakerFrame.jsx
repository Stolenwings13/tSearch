import React from "react";
import PropTypes from "prop-types";
import exKitRequest from "../tools/exKitRequest";
import exKitGetDoc from "../tools/exKitGetDoc";
import getDoc5 from "../sandbox/getDoc5";
import getLogger from "../tools/getLogger";
import getNodePath from "../tools/getNodePath";
import {sizzleQuerySelector, sizzleQuerySelectorAll} from "../tools/sizzleQuery";
import {inject, observer} from "mobx-react";
import RootStore from "../stores/RootStore";

const logger = getLogger('CodeMakerFrame');

@inject('rootStore')
@observer
class CodeMakerFrame extends React.Component {
  constructor(props) {
    super(props);

    this.frameStore.setState('idle');

    this.selectClassName = 'kit_select';
  }

  static propTypes = null && {
    rootStore: PropTypes.instanceOf(RootStore),
  };

  get frameStore() {
    return this.props.rootStore.codeMaker.frame;
  }

  componentDidMount() {
    if (this.frameStore.options) {
      this.requestPage(this.frameStore.options);
    }
  }

  componentWillUnmount() {
    this.abort();
  }

  frameDoc = null;
  doc = null;

  frame = null;
  refFrame = element => {
    this.frame = element;
  };

  reqTracker = {
    connectRe: /.+/,
    requests: [],
  };

  requestPage(options) {
    this.abort();

    this.frameStore.setState('pending');

    return Promise.resolve().then(() => {
      return exKitRequest(this.reqTracker, options);
    }).then(response => {
      const doc = exKitGetDoc(response.body, response.url);
      const newFrameDoc = getDoc5(response.body, response.url, this.frame.contentDocument);

      const kitStyle = document.createElement('style');
      kitStyle.textContent = `
      .${this.selectClassName} {
        color:#000 !important;
        background-color:#FFCC33 !important;
        cursor:pointer;
        box-shadow: 0 0 3px red, inset 0 0 3px red !important;
      }`;

      if (newFrameDoc.head) {
        newFrameDoc.head.appendChild(kitStyle);
      } else
      if (newFrameDoc.body) {
        newFrameDoc.body.appendChild(kitStyle);
      } else {
        newFrameDoc.appendChild(kitStyle);
      }

      const frameDoc = this.frame.contentDocument.documentElement.parentNode;
      frameDoc.textContent = '';
      while (frameDoc.childNodes.length) {
        frameDoc.removeChild(frameDoc.firstChild);
      }
      while (newFrameDoc.childNodes.length) {
        frameDoc.appendChild(newFrameDoc.firstChild);
      }

      this.doc = doc;
      this.frameDoc = frameDoc;

      this.frameStore.setState('done');

      return response;
    }, err => {
      this.frameStore.setState('error');

      logger.error('requestPage error', err);
    });
  }

  abort() {
    this.reqTracker.requests.forEach(request => {
      request.abort();
    });
  }

  resolvePath(path, options = {}) {
    const doc = options.doc || this.doc;
    const container = getContainer(doc, options);

    return sizzleQuerySelector(container, path);
  }

  highlightPath(path, options = {}) {
    const node = this.resolvePath(path, Object.assign({}, options, {
      doc: this.frameDoc
    }));

    this.hideSelect();
    if (node) {
      node.classList.add(this.selectClassName);
    }
  }

  hideSelect = () => {
    Array.from(this.frameDoc.querySelectorAll(`.${this.selectClassName}`)).forEach(element => {
      element.classList.remove(this.selectClassName);
    });
  };

  render() {
    let selectMode = null;
    if (this.frameStore.state === 'done' && this.frameStore.selectMode) {
      selectMode = (
        <CodeMakerFrameSelectMode key={'selectMode'} frameDoc={this.frameDoc} selectClassName={this.selectClassName} hideSelect={this.hideSelect}/>
      );
    }

    return [
      <iframe key={'frame'} ref={this.refFrame} sandbox="allow-same-origin allow-scripts"/>,
      selectMode
    ];
  }
}

const getContainer = (doc, options) => {
  let container = null;
  if (options.containerSelector) {
    container = sizzleQuerySelectorAll(doc, options.containerSelector);
    if (options.skipFromStart) {
      container.splice(0, options.skipFromStart);
    }
    if (options.skipFromEnd) {
      container.splice(options.skipFromEnd * -1);
    }
    container = container[0];
  } else {
    container = doc;
  }
  return container;
};

@inject('rootStore')
@observer
class CodeMakerFrameSelectMode extends React.Component {
  static propTypes = null && {
    rootStore: PropTypes.instanceOf(RootStore),
    frameDoc: PropTypes.instanceOf(HTMLDocument),
    selectClassName: PropTypes.string,
    hideSelect: PropTypes.func,
  };

  get frameStore() {
    return this.props.rootStore.codeMaker.frame;
  }

  componentDidMount() {
    this.props.frameDoc.addEventListener('mouseover', this.handleMouseOver);
    this.props.frameDoc.addEventListener('mouseup', this.handleClick);
  }

  componentWillUnmount() {
    this.props.hideSelect();
    this.props.frameDoc.removeEventListener('mouseover', this.handleMouseOver);
    this.props.frameDoc.removeEventListener('mouseup', this.handleClick);
  }

  handleClick = e => {
    const node = e.target;
    if (node.nodeType === 1) {
      const path = this.getPath(node);
      this.frameStore.selectHandler(path);
    }
  };

  handleMouseOver = e => {
    const node = e.target;
    if (node.nodeType === 1) {
      this.props.hideSelect();

      node.classList.add(this.props.selectClassName);

      const path = this.getPath(node);
      this.frameStore.selectListener(path);
    }
  };

  getPath(node) {
    let container = null;
    if (this.frameStore.containerSelector) {
      container = sizzleQuerySelector(this.props.frameDoc, this.frameStore.containerSelector);
    } else {
      container = this.props.frameDoc;
    }

    if (!container.contains(node)) {
      return '';
    }

    return getNodePath(node, container, {
      skipClassNames: [this.props.selectClassName]
    });
  }

  render() {
    return null;
  }
}

export default CodeMakerFrame;