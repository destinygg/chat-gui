import { AmazonAssociatesTagInjector } from './formatters';

const chatStub = {
  config: {
    amazonTags: {
      'www.amazon.com': 'cakesh-20',
      'www.amazon.ca': 'leafsh-20',
      'www.amazon.co.uk': 'bongsh-20',
      'www.amazon.de': 'beersh-20',
    },
  },
};

const chatStubWithoutTags = {
  config: {
    amazonTags: null,
  },
};

describe('Inject tag', () => {
  test.each([
    [
      'Into message',
      'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
      'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=cakesh-20',
      chatStub,
    ],
    [
      'Into message with international links',
      'for the canadians https://www.amazon.ca/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details the british https://www.amazon.co.uk/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details and the germans https://www.amazon.de/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
      'for the canadians https://www.amazon.ca/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=leafsh-20 the british https://www.amazon.co.uk/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=bongsh-20 and the germans https://www.amazon.de/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=beersh-20',
      chatStub,
    ],
    [
      'When tag exists',
      'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&tag=fakesh-20&ref=ppx_yo2_dt_b_product_details pretty cool eh?',
      'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&tag=cakesh-20&ref=ppx_yo2_dt_b_product_details pretty cool eh?',
      chatStub,
    ],
    [
      'Into message with parentheses',
      'hey ShawarmaFury, check out these cool earphones (https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details)',
      'hey ShawarmaFury, check out these cool earphones (https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=cakesh-20)',
      chatStub,
    ],
  ])('%s', (_, message, expectedMessage, stub) => {
    const injector = new AmazonAssociatesTagInjector();
    expect(injector.format(stub, message)).toBe(expectedMessage);
  });
});

describe("Don't inject tag", () => {
  test.each([
    [
      'When no tag for country exists',
      'welcome japan https://www.amazon.co.jp/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
      chatStub,
    ],
    [
      'When URL malformed',
      'hehehe nasty link incoming https://www.amazon.comF*()&*($^&)(#*^&$@#(()*&() hehe',
      chatStub,
    ],
    [
      'When no tags provided',
      'cool earphones check it out lads https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
      chatStubWithoutTags,
    ],
  ])('%s', (_, message, stub) => {
    const injector = new AmazonAssociatesTagInjector();
    expect(injector.format(stub, message)).toBe(message);
  });
});
