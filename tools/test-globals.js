import chai, {assert, expect} from 'chai';
import dirtyChai from 'dirty-chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.use(dirtyChai);

global.assert = assert;
global.expect = expect;
