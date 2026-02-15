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

function wrapWithParagraphs(text) {
  const t = escapeHtml(text || '').trim();
  if (!t) return '<p></p>';
  return t
    .split(/\n+/)
    .map((p) => `<p style="margin:0 0 8px 0;line-height:1.5">${p}</p>`)
    .join('');
}

const MATHJAX_HTML = (bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <script>
    MathJax = {
      tex: { inlineMath: [['\\\\(', '\\\\)']], displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']] },
      startup: { typeset: false }
    };
  </script>
  <style>
    body { margin: 0; padding: 8px; font-size: 15px; color: #1E293B; line-height: 1.5; }
    p { margin: 0 0 8px 0; }
  </style>
</head>
<body>
  <div id="content">${bodyContent}</div>
  <script>
    MathJax.typesetPromise([document.getElementById('content')]).catch(function() {});
  </script>
</body>
</html>
`;

export default function MathText({ value, style, containerStyle }) {
  const [height, setHeight] = useState(60);
  const webRef = useRef(null);

  const content = wrapWithParagraphs(value);
  const html = MATHJAX_HTML(content);

  if (Platform.OS === 'web') {
    return <MathTextWeb value={value} style={style} containerStyle={containerStyle} />;
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <WebView
        ref={webRef}
        source={{ html }}
        originWhitelist={['*']}
        scrollEnabled={false}
        style={[styles.webView, { minHeight: height }]}
        onMessage={(e) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!Number.isNaN(h) && h > 0) setHeight(h);
        }}
        injectedJavaScript={`
          (function() {
            setTimeout(function() {
              var h = document.body.scrollHeight;
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(h));
            }, 500);
          })();
          true;
        `}
      />
    </View>
  );
}

function MathTextWeb({ value, style, containerStyle }) {
  const divRef = useRef(null);
  const content = value || '';

  useEffect(() => {
    if (typeof document === 'undefined' || !divRef.current) return;
    const el = divRef.current;
    if (el.innerHTML !== undefined) {
      el.innerHTML = wrapWithParagraphs(content);
      if (typeof window !== 'undefined' && window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([el]).catch(() => {});
      }
    }
  }, [content]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (window.MathJax) return;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.onload = () => {
      window.MathJax = { tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]'], ['$$', '$$']] } };
      if (divRef.current && divRef.current.innerHTML) window.MathJax.typesetPromise([divRef.current]).catch(() => {});
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch (_) {} };
  }, []);

  return (
    <View ref={divRef} style={[styles.webContent, style, containerStyle]} />
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden', borderRadius: 8 },
  webView: { backgroundColor: 'transparent', width: '100%' },
  webContent: { fontSize: 15, color: '#1E293B', minHeight: 24 },
});
