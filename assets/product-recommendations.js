(async () => {
  const baseComponent = await import(window.theme.modules.baseComponent);

  customElements.define('product-recommendations', class extends baseComponent.default {
          
    render() {
      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');
          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }
        })
        .catch(e => {
          console.error(e);
        });
    };
  });
})();