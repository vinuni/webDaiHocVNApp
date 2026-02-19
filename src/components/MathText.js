/**
 * Renders text that may contain LaTeX (e.g. \( \), \[ \], $$).
 * Uses WebView + MathJax on native; on web uses a div + MathJax CDN.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

function escapeHtml(s) {
  if (s == null) return '';
  const str = String(s);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip HTML tags from API content (e.g. <p>...</p>) so LaTeX is not broken and tags are not shown. */
function stripHtmlTags(s) {
  if (s == null) return '';
  return String(s)
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Escape literal & inside math for LaTeX (MathJax "Misplaced &" fix).
 * Replace &amp; (standalone ampersand) with \&amp; so MathJax sees \&.
 * Do not replace &amp; when part of &amp;gt;, &amp;lt;, &amp;quot;, &amp;#39;, etc.
 */
function escapeAmpInMath(str) {
  return str.replace(/&amp;(?!gt;|lt;|quot;|#\d+;|#x[0-9a-fA-F]+;)/gi, '\\&amp;');
}

/** Prevent </script> in content from breaking the HTML document. */
function escapeScriptTag(s) {
  if (s == null) return '';
  return String(s).replace(/<\/script>/gi, '<\\/script>');
}

/** Wrap content for MathJax without <p> tags so equations are not broken. Use single div + br for newlines. */
function wrapContent(text) {
  let t = escapeHtml(stripHtmlTags(text)).trim();
  if (!t) return '';
  t = escapeAmpInMath(t);
  t = escapeScriptTag(t);
  return t.split(/\n+/).join('<br/>');
}

const MATHJAX_URLS = [
  'https://unpkg.com/mathjax@3/es5/tex-mml-chtml.js',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
  '/mathjax/tex-mml-chtml.js',
];

const MATHJAX_CONFIG = `
  MathJax = {
    tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']], processEscapes: true },
    startup: { typeset: false }
  };
`;

function getMathJaxLoader(heightCb, baseOrigin) {
  const base = baseOrigin || '';
  return `
(function(){
  var urls = ${JSON.stringify(MATHJAX_URLS)};
  var baseOrigin = ${JSON.stringify(base)};
  var idx = 0;
  function resolveUrl(url) {
    if (!url.startsWith('/')) return url;
    var origin = baseOrigin || (typeof location!=='undefined'&&location.origin&&location.origin!=='null'?location.origin:'') || '';
    return origin ? origin.replace(/\\/$/,'') + url : url;
  }
  function load(){
    if (idx >= urls.length) return;
    var s = document.createElement('script');
    s.onload = run;
    s.onerror = function(){ idx++; load(); };
    s.src = resolveUrl(urls[idx]);
    document.head.appendChild(s);
  }
  function run(){
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      var el = document.getElementById('content');
      if (el) {
        MathJax.typesetPromise([el]).then(function(){
          var h = document.body.scrollHeight;
          ${heightCb}
        }).catch(function(){ try{ var h = document.body.scrollHeight; window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(h)); } catch(e) {} });
      }
    } else {
      setTimeout(run, 80);
    }
  }
  load();
})();
`;
}

const DEFAULT_CONTENT_FONT_SIZE = 15;

const MATHJAX_HTML = (bodyContent, fontSize = DEFAULT_CONTENT_FONT_SIZE) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script>${MATHJAX_CONFIG}</script>
  <style>
    body { margin: 0; padding: 8px; font-size: ${Number(fontSize) || DEFAULT_CONTENT_FONT_SIZE}px; color: #1E293B; line-height: 1.5; -webkit-text-size-adjust: 100%; }
    #content { margin: 0; word-wrap: break-word; }
    mjx-container { overflow-x: auto; overflow-y: hidden; }
  </style>
</head>
<body>
  <div id="content">${bodyContent}</div>
  <script>${getMathJaxLoader("try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(h));}catch(e){}")}</script>
</body>
</html>
`;

export default function MathText({ value, style, containerStyle, contentFontSize }) {
  const [height, setHeight] = useState(60);
  const webRef = useRef(null);
  const fontSize = contentFontSize != null ? Number(contentFontSize) : DEFAULT_CONTENT_FONT_SIZE;

  const content = wrapContent(value);
  const html = MATHJAX_HTML(content, fontSize);

  if (Platform.OS === 'web') {
    return <MathTextWeb value={value} style={style} containerStyle={containerStyle} contentFontSize={contentFontSize} />;
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <WebView
        ref={webRef}
        source={{ html }}
        originWhitelist={['*', 'https://*', 'http://*']}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={[styles.webView, { minHeight: height }]}
        onMessage={(e) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!Number.isNaN(h) && h > 0) setHeight(h);
        }}
        injectedJavaScript={`
          (function() {
            setTimeout(function() {
              var h = document.body.scrollHeight;
              if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(String(h));
            }, 1500);
          })();
          true;
        `}
      />
    </View>
  );
}

function MathTextWeb({ value, style, containerStyle, contentFontSize }) {
  const content = value || '';
  const [height, setHeight] = useState(80);
  const fontSize = contentFontSize != null ? Number(contentFontSize) : DEFAULT_CONTENT_FONT_SIZE;

  const html = React.useMemo(() => {
    const bodyContent = wrapContent(content);
    const heightCb = "try{window.parent.postMessage(JSON.stringify({type:'mathjaxHeight',height:h}),'*');}catch(e){}";
    const origin = typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<script>${MATHJAX_CONFIG}</script>
<style>body{margin:0;padding:8px;font-size:${fontSize}px;color:#1E293B;line-height:1.5}#content{margin:0}</style></head>
<body><div id="content">${bodyContent}</div>
<script>${getMathJaxLoader(heightCb, origin)}</script></body></html>`;
  }, [content, fontSize]);

  useEffect(() => {
    const handler = (e) => {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && d.type === 'mathjaxHeight' && typeof d.height === 'number' && d.height > 0) setHeight(d.height);
      } catch (_) {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (typeof document === 'undefined') {
    return <View style={[styles.webContent, style, containerStyle]} />;
  }

  return (
    <View style={[styles.webContent, { minHeight: height }, style, containerStyle]}>
      <iframe
        srcDoc={html}
        title="Math content"
        style={{
          width: '100%',
          minHeight: height,
          border: 0,
          background: 'transparent',
          display: 'block',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden', borderRadius: 8 },
  webView: { backgroundColor: 'transparent', width: '100%' },
  webContent: { fontSize: 15, color: '#1E293B', minHeight: 24 },
});
