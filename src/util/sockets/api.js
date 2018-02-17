import * as Actions from '../../tourney/TourneyActions';
import io from 'socket.io'

var socket = null;

export function wsMiddleware() {
  return (next) => (action) => {
    if (socket && action.type === 'ApiGetData') {

      console.log('ApiGetData');
      socket.emit('client:GetData', {});

    } else if (socket && action.type === 'ApiSetData') {

      console.log('ApiSetData');
      socket.emit('client:SetData', action.data);

    }

    return next(action);
  };
}

export default function (store) {

  socket = new io();

  socket.on('update', () => {
    console.log('socket update');
    store.dispatch(Actions.apiGetData());
  });
}
