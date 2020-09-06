import * as assert from 'assert';

/**
 * 正規表現のテストに利用する関数
 * テキストと正規表現を受け取り、正規表現と一致した部分のテキストを返す関数
 * @param text 正規表現との一致を調べるテキスト
 * @param reg テキストとの一致を調べる正規表現
 * @return 正規表現と一致する部分のテキスト，一致しなければ空文字を返す
 */
function getMatchedString(text:string, reg:RegExp){
    let result = text.match(reg);
    if(result === null){
        return "";
    }
    return result[0];
}

suite("自身のファイル内の定義、定理、ラベルを参照する場合の正規表現のテスト", () => {
    let regex = /(by\s+(\w+(,|\s|:)*)+|from\s+\w+(:sch\s+\d+)*\((\w+,*)+\))/;
    test("by以降のテスト(abcmiz_0.mizより引用)", () => {

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

        let test4 = getMatchedString("from MinimalFiniteSet(A2);", regex);
        assert.equal(test4, "from MinimalFiniteSet(A2)");
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
    let regex = /(\w+:def\s+\d+|\w+\s*:\d+|\w+:sch\s+\d+)/;
    test("abcmiz_0.mizより引用", () => {
        let test1 = getMatchedString("RELSET_1:8", regex);
        assert.equal(test1, "RELSET_1:8");

        let test2 = getMatchedString("ZFMISC_1:def 10", regex);
        assert.equal(test2, "ZFMISC_1:def 10");

        let test3 = getMatchedString("XBOOLE_0:sch 1", regex);
        assert.equal(test3, "XBOOLE_0:sch 1");
    });
});
