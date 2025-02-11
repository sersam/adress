import { useState, useMemo } from "react";
import React from "react";

export default function AutoComplete({municipality, province}) {
    const [query, setQuery] = useState("");
    // state that hold API data
    const [suggestion, setSuggestion] = useState([]);

    const getLocations = async (e) => {
        setQuery(e.target.value)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${e.target.value} ${municipality} ${province}`);
        const data = await response.json();
        setSuggestion(data);
    };

    function debounce(callback, wait) {
        let timerId;
        return function (...args) {
            const context = this;
            if (timerId) clearTimeout(timerId)
            timerId = setTimeout(() => {
                timerId = null
                callback.apply(context, args)
            }, wait);
        };
    }

    const debouncedResults = useMemo(() => debounce(getLocations, 300), []);

    return (
        <form>
            <input
                type="text"
                placeholder="Type location"
                name="query"
                onChange={debouncedResults}
                list="locations"
            />
            <datalist id="locations">
                {query.length > 0 && // // required to avoid the dropdown list to display the locations fetched before
                    suggestion?.map((el, index) => {
                        if (el.display_name.toLowerCase().includes(query)) {
                            return <option key={index} value={el.display_name} />;
                        }
                        return "";
                    })}
            </datalist>
            <button>Search</button>
        </form>
    );
}