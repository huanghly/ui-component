import React, {  Fragment } from 'react';

interface  EmptyProps {
  prefixCls?: string,
  className?: string,
  height?: number,
  style?: React.CSSProperties,
  description?: React.ReactNode,
  children?: React.ReactNode,
  image?: React.ReactNode,
  imageStyle?: React.CSSProperties,

}

interface EmptyType extends React.FC<EmptyProps> {
  PRESENTED_IMAGE_DEFAULT: React.ReactNode;
  PRESENTED_IMAGE_SIMPLE: React.ReactNode;
}

const Empty: EmptyType = ({
  className,
  prefixCls,
  height =  document.documentElement.clientHeight,
  description,
  children,
  imageStyle,
  image,
  // image = 'https://static.aistarfish.com/front-release/file/F2021071517021164300006111.pic_none@3x(1).png',
  ...restProps

}) => {
  const des = typeof description !== 'undefined' ? description : '';
  const alt = typeof des === 'string' ? des : 'empty';
  let imageNode: React.ReactNode = null;

  if(typeof image ==='string' ){
    // 传入的是图片的src
   imageNode = <img src={image} alt={alt} />
  } else {
    imageNode = image;
  }
  return (
   <div className={`hx-starfish-empty ${className}`} {...restProps} >
    {
      imageNode &&  <div style={imageStyle} className={`hx-starfish-empty-image`}>
      {imageNode}
     </div>
    }
     {<div className={`hx-starfish-empty-description`}>{des?des:'暂无数据'}</div>}
     {children && <div className={`hx-starfish-empty-footer`}>{children}</div>}
   </div>
  )
}
Empty.PRESENTED_IMAGE_DEFAULT = '';
Empty.PRESENTED_IMAGE_SIMPLE = '';
export default Empty;