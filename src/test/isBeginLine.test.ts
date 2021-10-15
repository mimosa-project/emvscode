import * as assert from 'assert';
import { isBeginLine } from '../countLines';

suite("isBeginLineのテスト", () => {
    test("trueの場合", () => {
        let test1 = 'begin';
        assert.strictEqual(isBeginLine(test1), true);

        let test2 = 'begin reserve a for Nat;';
        assert.strictEqual(isBeginLine(test2), true);

        let test3 = '  begin ';
        assert.strictEqual(isBeginLine(test3), true);

        let test4 = '  begin reserve a for Nat;';
        assert.strictEqual(isBeginLine(test4), true);

        let test5 = 'begin :: something comments';
        assert.strictEqual(isBeginLine(test5), true);
    });

    test("falseの場合", () => {
        let test1 = ':: begin reserve a for Nat;';
        assert.strictEqual(isBeginLine(test1), false);

        let test2 = ':: begin';
        assert.strictEqual(isBeginLine(test2), false);

        let test3 = '::begin';
        assert.strictEqual(isBeginLine(test3), false);

        let test4 = '::: begin reserve a for Nat;';
        assert.strictEqual(isBeginLine(test4), false);

        let test5 = ':: aaa begin bbb';
        assert.strictEqual(isBeginLine(test5), false);

        let test6 = '::: begin bbb';
        assert.strictEqual(isBeginLine(test6), false);

        let test7 = ':: aaaa begin';
        assert.strictEqual(isBeginLine(test7), false);

        let test8 = ':: aaa bbb begin ccc';
        assert.strictEqual(isBeginLine(test8), false);

        let test9 = ':: comment';
        assert.strictEqual(isBeginLine(test9), false);
    });
});