import { AmazonAssociatesTagInjector } from './formatters'

const chatStub = {
    config: {
        amazonTag: 'cakesh-20'
    }
}

test.each([
    [
        'Inject tags into message with two links',
        'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details and this too https://www.amazon.com/dp/B07VP5WG78?psc=1&ref=ppx_yo2_dt_b_product_details',
        'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=cakesh-20 and this too https://www.amazon.com/dp/B07VP5WG78?psc=1&ref=ppx_yo2_dt_b_product_details&tag=cakesh-20',
        null
    ],
    [
        'Replace existing tag with new tag',
        'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&tag=fakesh-20&ref=ppx_yo2_dt_b_product_details pretty cool eh?',
        'hey check these out https://www.amazon.com/dp/B08LMBJFGD?psc=1&tag=cakesh-20&ref=ppx_yo2_dt_b_product_details pretty cool eh?',
        null
    ],
    [
        'Return original message if it becomes too long',
        'cool earphones check it out lads https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
        'cool earphones check it out lads https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details',
        110
    ],
    [
        'Don\'t inject tags into non-Amazon links',
        'lol click this link to see something cool https://www.destiny.gg/logout',
        'lol click this link to see something cool https://www.destiny.gg/logout',
        null
    ],
])('%s', (_, message, expectedMessage, maxMessageSize) => {
    const injector = new AmazonAssociatesTagInjector(maxMessageSize)
    expect(injector.format(chatStub, message)).toBe(expectedMessage)
})
