import React, { useState } from 'react';

/* ---------- */
import './searchResult.scss';
/* ---------- */

function SearchResult(props) {
    const { name, isTvShow, year } = props.movie
    const [hoverState, setHoverState] = useState(false)
    
    return (
        <div className={`search-result ${props.last ? 'last' : ''} ${props.hoverState ? 'parent-hovered' : ''} ${hoverState ? 'self-hovered' : ''}`} 
            onMouseEnter={() => setHoverState(true)}
            onMouseLeave={() => setHoverState(false)}
        >
            <div>
                <p title={name}>{name.length <= 35 ? name : name.slice(0,36) + '...'}</p>
            </div>

            <div className="result-meta">
                <div className="meta-type">
                    <p>{isTvShow ? 'TV Show' : 'Movie'}</p>
                </div>

                <div>
                    <p>({year})</p>
                </div>
            </div>
        </div>
    )
}

/* ---------- */

export default SearchResult;