import { AmazonAssociatesTagInjector } from './formatters'

const chatStub = {
    config: {
        amazonTag: 'cakesh-20'
    }
}

test('Inject tag into Amazon link', () => {
    const message = 'hey check out these new earphones i bought https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details pretty cool eh?'
    const expectedMessage = 'hey check out these new earphones i bought https://www.amazon.com/dp/B08LMBJFGD?psc=1&ref=ppx_yo2_dt_b_product_details&tag=cakesh-20 pretty cool eh?'

    const injector = new AmazonAssociatesTagInjector()
    expect(injector.format(chatStub, message)).toBe(expectedMessage)
})
