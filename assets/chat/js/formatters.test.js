import { AmazonAssociatesTagInjector } from './formatters'

const chatStub = {
    config: {
        amazonTags: {
            'www.amazon.com': 'cakesh-20',
            'www.amazon.ca': 'leafsh-20',
            'www.amazon.co.uk': 'bongsh-20',
            'www.amazon.de': 'beersh-20'
        }
    }
}

const chatStubWithoutTags = {
    config: {
        amazonTags: null
    }
}

describe('Inject tag', () => {
    test.each([
        [
            'Into message',
            'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
            'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=cakesh-20',
            null,
            chatStub
        ],
        [
            'Into message with international links',
            'for the canadians https://www.amazon.ca/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details the british https://www.amazon.co.uk/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details and the germans https://www.amazon.de/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
            'for the canadians https://www.amazon.ca/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=leafsh-20 the british https://www.amazon.co.uk/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=bongsh-20 and the germans https://www.amazon.de/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=beersh-20',
            null,
            chatStub
        ],
        [
            'When tag exists',
            'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&tag=fakesh-20&ref=ppx_yo2_dt_b_product_details pretty cool eh?',
            'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&tag=cakesh-20&ref=ppx_yo2_dt_b_product_details pretty cool eh?',
            null,
            chatStub
        ],
    ])('%s', (_, message, expectedMessage, maxMessageSize, chatStub) => {
        const injector = new AmazonAssociatesTagInjector(maxMessageSize)
        expect(injector.format(chatStub, message)).toBe(expectedMessage)
    })
})

describe('Don\'t inject tag', () => {
    test.each([
        [
            'When no tag for country exists',
            'welcome japan https://www.amazon.co.jp/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
            null,
            chatStub
        ],
        [
            'When message becomes too long',
            'cool earphones check it out lads https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
            110,
            chatStub
        ],
        [
            'When URL malformed',
            'hehehe nasty link incoming https://www.amazon.comF*()&*($^&)(#*^&$@#(()*&() hehe',
            null,
            chatStub
        ],
        [
            'When no tags provided',
            'cool earphones check it out lads https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
            null,
            chatStubWithoutTags
        ],
    ])('%s', (_, message, maxMessageSize, chatStub) => {
        const injector = new AmazonAssociatesTagInjector(maxMessageSize)
        expect(injector.format(chatStub, message)).toBe(message)
    })
})
