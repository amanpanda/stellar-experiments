import _ from 'lodash';
import {
  createSinks,
  createSource,
  sendPayment,
} from './src/utils';

const doExperiment = async (nSinks) => {
  // Create sinks
  const sinks = await createSinks(nSinks);
  const source = await createSource();

  const res = await Promise.all(_.map(sinks, sink => sendPayment({
    source,
    destination: sink,
  })));

  console.log("res.length", res.length);
};

doExperiment(10000);





 