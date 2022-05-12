import React from 'react'
import Image from 'next/image'

export default function Loading() {
    return (
        <>
            <div className="loading">
                <Image src="/images/loading.gif" alt="loading" width="48px" height="48px"/>
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
                      width: 48px;
                      height: 48px;
                    }
                  }
                `}
            </style>
        </>
    )
}

