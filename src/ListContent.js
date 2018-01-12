import React, { PureComponent, Fragment } from "react";
import remark from "remark";
import reactRenderer from "remark-react";
import slug from "remark-slug";
import headings from "remark-autolink-headings";
import emoji from "remark-gemoji-to-emoji";
import strip from "remark-strip-html";
import behead from "remark-behead";
import sanitizeGhSchema from "hast-util-sanitize/lib/github.json";
import "github-markdown-css";

import { removeTOC } from "./markdownUtils";
import CustomLink from "./CustomLink";
import { AnchorIcon } from "./Icon";
import "./ListContent.css";

const Headings = ["h1", "h2", "h3", "h4", "h5", "h6"].map(Heading => ({ children, ...props }) => (
  <Heading {...props}>
    <a href={`#${props.id}`} aria-hidden="true" className="anchor">
      <AnchorIcon aria-hidden="true" className="octicon octicon-link" height="16" width="16" />
    </a>
    {children}
  </Heading>
));

class ListContent extends PureComponent {
  state = {
    content: null,
  };

  renderMarkdown(text) {
    let mark = remark()
      .use(strip)
      .use(slug);

    if (this.props.behead) {
      mark = mark.use(behead, this.props.behead);
    }

    mark
      .use(removeTOC)
      .use(headings)
      .use(emoji, { padSpaceAfter: true })
      .use(reactRenderer, {
        sanitize: {
          ...sanitizeGhSchema,
          // Remove user-content from github.json to remark-slug work as expected.
          // See https://github.com/remarkjs/remark-slug/issues/8
          clobberPrefix: "",
        },
        remarkReactComponents: {
          a: CustomLink,
          h1: Headings[0],
          h2: Headings[1],
          h3: Headings[2],
          h4: Headings[3],
          h5: Headings[4],
          h6: Headings[5],
        },
      })
      .process(text, (e, res) => {
        try {
          this.setState({ content: res.contents.props.children });
        } catch (e) {
          window.Raven.captureException(e);
          console.error(e);
          this.setState({ content: "An error has occurred." });
        }
      });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.text !== nextProps.text) {
      this.renderMarkdown(nextProps.text);
    }
  }

  componentDidMount() {
    if (this.props.text) {
      this.renderMarkdown(this.props.text);
    }
  }

  render() {
    return (
      <Fragment>
        <div id="table-of-contents" />
        <div id="start-of-content" />
        <div id="contents" />

        <div id="readme" className="markdown-body p-4 xl:p-8 max-w-xl mx-auto">
          {this.state.content || "Loading…"}
        </div>
      </Fragment>
    );
  }
}

export default ListContent;
