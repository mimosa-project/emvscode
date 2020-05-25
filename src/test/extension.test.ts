import * as assert from 'assert';

function getMatchedString(text:string, reg:RegExp){
    let result = text.match(reg);
    if(result === null){
        return "";
    }
    return result[0];
}

// Defines a Mocha test suite to group tests of similar kind together

suite("自身のファイル内の定義、定理、ラベルを参照する場合の正規表現のテスト", () => {
    // テスト対象の正規表現
    let regex = /(by\s+(\w+(,|\s|:)*)+|(from\s+\w+(:\s*sch\s+\d+)*\s*\(\s*(\w+,*\s*)+\)))/;

    test("by以降のテスト(abcmiz_0.mizより引用)", () => {
        let test1 = getMatchedString("by A1;", regex);
        assert.equal(test1, "by A1");

        let test2 = getMatchedString("by A1,A2,A3;", regex);
        assert.equal(test2, "by A1,A2,A3");

        let test3 = getMatchedString("by A2,A3,A4,FUNCT_1:def 2;", regex);
        assert.equal(test3, "by A2,A3,A4,FUNCT_1:def 2");

        let test4 = getMatchedString("by A1,Th13;", regex);
        assert.equal(test4, "by A1,Th13");
    });

    test("from以降のテスト(abcmiz_0.mizより引用)", () => {
        let test1 = getMatchedString("from XBOOLE_0:sch 2(A5,A6);", regex);
        assert.equal(test1, "from XBOOLE_0:sch 2(A5,A6)");

        let test2 = getMatchedString("from RECDEF_1:sch 3(A1);", regex);
        assert.equal(test2, "from RECDEF_1:sch 3(A1)");

        let test3 = getMatchedString("from NAT_1:sch 2(A11,A7);", regex);
        assert.equal(test3, "from NAT_1:sch 2(A11,A7)");

        let test4 = getMatchedString("from ORDERS_1:\n  sch 2(A31,A4,A5,A6);", regex);
        assert.equal(test4, "from ORDERS_1:\n  sch 2(A31,A4,A5,A6)");

        let test5 = getMatchedString("from MinimalFiniteSet(A2);", regex);
        assert.equal(test5, "from MinimalFiniteSet(A2)");

        // 以下のテストは現状未対応 -> 修正したのでテスト中
        let test6 = getMatchedString("from ORDERS_1:\r\n  sch 2(A31,A4,A5,A6);", regex);
        assert.equal(test6, "from ORDERS_1:\r\n  sch 2(A31,A4,A5,A6)");

        let test7 = getMatchedString("from MinimalFiniteSet(\r\n  A2);", regex);
        assert.equal(test7, "from MinimalFiniteSet(\r\n  A2)");

        let test8 = getMatchedString("from RedInd(A2,\r\n  A3,A1);", regex);
        assert.equal(test8, "from RedInd(A2,\r\n  A3,A1)");

        let test9 = getMatchedString("from RedInd(A4,\r\n  A5,A3);", regex);
        assert.equal(test9, "from RedInd(A4,\r\n  A5,A3)");
    });

    test("自作テスト", () => {
        let test1 = getMatchedString("by  A1;", regex);
        assert.equal(test1, "by  A1");

        let test2 = getMatchedString("by A1,    A2,  A3;", regex);
        assert.equal(test2, "by A1,    A2,  A3");

        let test3 = getMatchedString("by A1, FUNCT_1:def 2, A2;", regex);
        assert.equal(test3, "by A1, FUNCT_1:def 2, A2");
    });
});

suite("外部のファイル内の定義、定理を参照する場合の正規表現のテスト", () => {
    let regex = /(\w+:def \d+|\w+:\d+|\w+:sch \d+)/;
    test("aaa", () => {

    });
});