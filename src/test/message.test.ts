import * as assert from 'assert';
import { makeQueryFunction } from '../mizarMessages';

suite("エラーメッセージ取得関数の検証", () => {
    let queryMizarMsg = makeQueryFunction();
    test("_queryMizarMsg関数のテスト", () => {

        let answer1 = 'This inference is not accepted';
        assert.strictEqual(queryMizarMsg(4), answer1);

        let answer2 = 'The structure of the sentences disagrees with the scheme';
        assert.strictEqual(queryMizarMsg(20), answer2);

        let answer3 = 'As yet not implemented for redefined functors';
        assert.strictEqual(queryMizarMsg(89), answer3);

        let answer4 = 'Right functor bracket expected';
        assert.strictEqual(queryMizarMsg(310), answer4);

        let answer5 = 'Invalid file handle';
        assert.strictEqual(queryMizarMsg(1006), answer5);
    });
});
