import React from 'react';
import ReactDOM from 'react-dom';
import RootStore from "./stores/RootStore";
import {HashRouter, Route, Switch} from 'react-router-dom';
import {Provider} from 'mobx-react';
import routes from "./routes";
import '../src/assets/css/index.less';

const rootStore = window.rootStore = RootStore.create();

ReactDOM.render(
  <HashRouter>
    <Provider rootStore={rootStore}>
      <Switch>
        {routes.map(route => {
          return (
            <Route key={`route-${route.path}`} {...route}/>
          );
        })}
      </Switch>
    </Provider>
  </HashRouter>,
  document.getElementById('root')
);