import React from 'react'
import Image from 'next/image'

export default function Loading() {
    return (
        <>
            <div className="loading">
                <Image src="/images/loading.gif" alt="loading" width={'128px'} height={'128px'}/>
            </div>
            <style jsx>
                {`
                  /* lading */
                  .loading {
                    position: fixed;
                    z-index: 9999;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #f0f8ff;
                    background-color: rgba(0, 0, 0, 0.5);

                    img {
                      width: 128px;
                      height: 128px;
                    }
                  }
                `}
            </style>
        </>
    )
}

