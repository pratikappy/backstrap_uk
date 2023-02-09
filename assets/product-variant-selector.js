(async () => {
    const {
      updateURLParams,
      historyPush,
      parseHTML,
      getParentSection
    } = await import(window.theme.modules.utils);
    
    const isEqual = (arr1, arr2) => arr1.toString() === arr2.toString();
    const strEsc = (str) => str.replace(/["\\]/g, '\\$&');
    const parseJSON = (el) => JSON.parse(el.textContent)
    const baseComponent = await import(window.theme.modules.baseComponent);
  
    customElements.define('product-variant-selector', class extends baseComponent.default {
      elements = {
        variantsJSON: '[data-variants-json]',
        optionsJSON: '[data-options-with-values]'
      };
      
      render() {
        this.cache = {};
        this.isProductPage = this.hasAttribute('product-page');
        this.variantsData = parseJSON(this.$variantsJSON);
        this.optionsData = parseJSON(this.$optionsJSON);
        this._getDefaultVariant();
        this._checkUnavailable();
        this.addEventListener('change', this._variantChangeHandler.bind(this));
        this.on('qtyStatusUpdate', (e, data) => {
          this.cache[+data.variantId] = data.html.outerHTML
        }, false)
        this._setInititalCache();
      };
  
      _getDefaultVariant() {
        this.variant = this.variantsData.find(v => v.id === +this.getAttribute('current-variant-id'));
      };

      _setInititalCache() {
        const parentSection = this.getParentSection();
        this.cache[this.variant.id] = parentSection.outerHTML;
      };
  
      _checkUnavailable() {
        this.optionsData.map((option, i) => {
          let optionsToCheck = [...this.variant.options];
          option.values.map(optionValue => {
            optionsToCheck[i] = optionValue;
            const match = this._findVariantByOptions(optionsToCheck);
            this._toggleOption(option.name, optionValue, !match);   
          })
        })
      };
  
      _toggleOption(name, value, disable) {
        const targetInput = this.querySelector(`[name="${strEsc(name)}"][value="${strEsc(value)}"`);
        disable
          ? targetInput.setAttribute('data-unavailable', '')
          : targetInput.removeAttribute('data-unavailable');
      };
  
      _variantChangeHandler(e) {
        if (!e.detail?.synthetic) {
            this._selectVariantByOption(e.target);
            const { queryURL, currentURL } = updateURLParams({ 'variant': this.variant.id }, this.sectionId, window.location.origin + this.getAttribute('product-url'));
            if (this.isProductPage) historyPush(currentURL);
            this._checkUnavailable();

            const cached = this.cache[this.variant.id];
            // console.log(cached);
            // console.log(this.cache);

            if (cached) {
              this.forwardEvent('variantChange', {
                  html: parseHTML(cached),
                  variant: this.variant
              })
            } else {
              this._fetchPageWithVariant(queryURL, (html) => {
                this.cache[this.variant.id] = html;
                this.forwardEvent('variantChange', {
                        html: parseHTML(html),
                        variant: this.variant
                    })
                });
            }
            
        }  
      };
  
      _selectVariantByOption(target) {
        let valueIndex = this.optionsData.findIndex(option => option.name === target.name);
        if (target.hasAttribute('data-unavailable')) {
          this.variant = this.variantsData.find(variant => variant.options[valueIndex] === target.value);
          this._toogleInputs(target)
        } else {
          let optionsToFind = [...this.variant.options];
          optionsToFind[valueIndex] = target.value;
          this.variant = this._findVariantByOptions(optionsToFind);
        }
      };
  
      _toogleInputs(target) {
        this.variant.options.map((option, i) => {
          if(option !== target.value) {
            const input = this.querySelector(`input[value="${strEsc(option)}"][name="${strEsc(this.optionsData[i].name)}"]`);
            input.checked = true;
            input.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { synthetic: true } }));
          }
        }) 
      };
  
      _findVariantByOptions(options) {
        return this.variantsData.find(variant => isEqual(variant.options, options));
      };
  
      _updateSwatchLable(swatchInput) {
        swatchInput.closest('product-variant-swatch').querySelector('[data-swatch-value]').textContent = swatchInput.value;
      };
  
      _fetchPageWithVariant(url, onResponse) {
        this.forwardEvent('variantLoading');
        return fetch(url)
        .then(response => response.text())
        .then(responseText => {
          onResponse(responseText);
        });
      };    
    });

    customElements.define('product-option-picker', class extends baseComponent.default {
        elements = {
            value: '[data-option-value]'
        }
        render() {
            this.addEventListener('change', e => {
                if(this.$value) {
                    this.$value.innerText = e.target.value;
                }
            })
        }
    })
  })();