import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Dropdown, Transition, Segment, Icon } from 'semantic-ui-react'
import { browser } from "webextension-polyfill-ts";
import OptionTable from '../optionTable';
import fuzzysort from 'fuzzysort';
import { FetchPageContext, PageContext, Copy } from '../messages';

const storage = browser.storage.local;

interface Option {
    key: string
    text: string
    value: string
    content: JSX.Element
}

export const Popup: React.FC = () => {

    const [selecting, setSelecting] = useState<boolean>(true);
    const [copyTemplates, setCopyTemplates] = useState<Option[]>([]);
    const dropdownRef = useRef(null);
    const [selectedValue, setSelectedValue] = useState<string>('');

    const onChangedSelection = useCallback((e, { value }) => {
        setSelectedValue(value);
    }, []);

    const onComplete = useCallback(async (e) => {
        await browser.runtime.sendMessage(browser.runtime.id, new Copy(selectedValue));
        setSelecting(false);
        setTimeout(() => window.close(), 1000);
    }, [selectedValue]);

    useEffect(() => {
        (async () => {
            dropdownRef.current.ref.current.querySelector('input').focus();
            const response: Promise<PageContext> = browser.runtime.sendMessage(browser.runtime.id, new FetchPageContext());
            const option = storage.get('option').then(d => OptionTable.deserialize(d.option));
            const contextType = (await response).contextType;
            const templates = (await option).templates;
            setCopyTemplates(
                templates
                    .filter(v => v.enableContexts.includes(contextType))
                    .map((v, i) => {
                        return { key: v.id, text: v.name, value: v.id, content: (<span>{v.name}</span>) };
                    })
            );
            setSelectedValue(templates.length > 0 ? templates[0].id : null);
        })();
    }, []);

    const fuzzySearch = (options: Option[], query: string) => {
        return fuzzysort.go(query, options, {key: 'text'}).map(result => {
            const highlighted: JSX.Element[] =
                Array.from(result.target).map((char, index) => {
                    if (result.indexes.includes(index)) {
                        return (<b>{char}</b>)
                    } else {
                        return (<span>{char}</span>)
                    }
                });
            return Object.assign({}, result.obj, {
                content: highlighted
            });
        });
    };

    return (
        <div>
            {
                selecting
                ?
                    <Dropdown
                        ref={dropdownRef}
                        icon=''
                        fluid
                        defaultOpen
                        search={fuzzySearch}
                        selection
                        options={copyTemplates}
                        onChange={onChangedSelection}
                        onClose={onComplete}
                        value={selectedValue}
                    />
                : <div />
            }
            <Transition visible={!selecting} animation='slide down' duration={100}>
                <Segment textAlign='left' vertical style={{ 'margin-left': '1rem' }}>
                    <Icon name='check' size='big' color='green' />
                    <span>{selecting ? '' : copyTemplates.find(t => t.value === selectedValue).text}</span>
                </Segment>
            </Transition>
        </div>
    );
};
