import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Button from '../../ui/button';
import { getIsLightNodeEnabled } from '../../../selectors';
import { stopLightNode, startLightNode } from '../../../store/actions';

export default function LightNodeEnableButton() {
  const dispatch = useDispatch();
  const lightNodeEnabled = useSelector(getIsLightNodeEnabled);
  const stopNode = () => dispatch(stopLightNode());
  const startNode = () => dispatch(startLightNode());

  const onClick = async () => {
    if (lightNodeEnabled) {
      await stopNode();
      return;
    }

    await startNode();
  };

  return (
    <Button
      type="primary"
      large
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {lightNodeEnabled ? 'Stop Light Node' : 'Start Light Node'}
    </Button>
  );
}
