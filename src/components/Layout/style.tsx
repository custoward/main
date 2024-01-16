import React from 'react';

interface WrapperProps  {
	children: any;
}

function Wrapper({ children }:WrapperProps) {
  const style = {
    //border: '2px solid black',
    //padding: '16px',
  };
  return(
    <div style = {style}>
        {children}
    </div>
  );
}

export default Wrapper;