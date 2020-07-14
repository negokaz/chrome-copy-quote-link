import React, { useState, useMemo, forwardRef, useImperativeHandle, useCallback, useEffect, useRef } from 'react';

import { Input, Form, Radio, Button, Icon, Card, Transition, Popup } from 'semantic-ui-react'

import { Template as TemplateState } from '../template';

import './template.css';
import { Menus } from 'webextension-polyfill-ts';

export interface TemplateProps {
    state: TemplateState

    isNew?: boolean

    onRemove: (state: TemplateState) => void
}

export interface TemplateRef {
    template(): TemplateState;
}

export const Template = forwardRef<TemplateRef, TemplateProps>((props, ref) => {

    const [state, setState] = useState(props.state);
    const [showRemove, setShowRemove] = useState(false);
    const [templateWasChanged, setTemplateWasChanged] = useState(false);
    const [templateError, setTemplateError] = useState<string>(null);

    useImperativeHandle(ref, () => ({
        template() {
            return state;
        }
    }));

    const nameInputRef = useRef<Input>(null);

    useEffect(() => {
        if (props.isNew) {
            nameInputRef.current.focus();
        }
    }, []);

    const scopeInputName = useMemo(() => `scope-${props.state.id}`, []);

    const remove = useCallback(() => props.onRemove(state), []);

    const handleNameChange  = useCallback((e, { value }) => setState(current => current.withName(value)), []);
    const handleScopeChange = useCallback((e, { value }) => setState(current => current.withEnableContexts(value)), []);

    const tryUpdateTemplate = (currentState: TemplateState, template: string) => {
        setTemplateWasChanged(true);
        const newState = currentState.withTemplate(template);
        const result = newState.validate();
        setTemplateError(result instanceof Error ? result.message : null);
        return newState;
    };

    const handleTemplateChange = useCallback((e, { value }) => setState(current => tryUpdateTemplate(current, value)),[]);

    return (
        <Card id={`template-${props.state.id}}`} fluid onMouseEnter={() => setShowRemove(true)} onMouseLeave={() => setShowRemove(false)}>
            <Card.Content>
                <Transition visible={showRemove} animation='fade' duration={200}>
                    <Button animated='fade' size='tiny' onClick={remove} floated='right'>
                        <Button.Content visible><Icon name='trash' /></Button.Content>
                        <Button.Content hidden>Remove</Button.Content>
                    </Button>
                </Transition>
                <div className='element-block'>
                    <Form.Group inline>
                        <Form.Field error={templateWasChanged && state.name.length === 0}>
                            <Input size='small' placeholder='template name' ref={nameInputRef} value={state.name} onChange={handleNameChange} />
                        </Form.Field>
                        <label className='element-inline'>for:</label>
                        <Form.Radio
                            className='element-inline'
                            label='page'
                            name={scopeInputName}
                            value='page'
                            checked={state.enableContexts.some(c => c === 'page')}
                            onChange={handleScopeChange}
                            error={templateWasChanged && state.enableContexts.length === 0}
                        />
                        <Form.Radio
                            className='element-inline'
                            label='selection'
                            name={scopeInputName}
                            value='selection'
                            checked={state.enableContexts.some(c => c === 'selection')}
                            onChange={handleScopeChange}
                            error={templateWasChanged && state.enableContexts.length === 0 ? 'please select' : null}
                        />
                    </Form.Group>
                </div>
                <div>
                    <Popup
                        on='focus'
                        content={
                            <dl>
                                <dt>{'{{title}}'}</dt>
                                <dd>page title</dd>
                                <dt>{'{{url}}'}</dt>
                                <dd>page URL</dd>
                                <dt>{'{{url_to_text}}'}</dt>
                                <dd>page URL with Scroll To Text Fragment</dd>
                                <dt>{'{{text}}'}</dt>
                                <dd>selected text</dd>
                                <dt>{'{{#texts}} {{.}} {{/texts}}'}</dt>
                                <dd>selected text separated by lines</dd>
                            </dl>
                        }
                        wide={true}
                        trigger={
                            <Form.TextArea
                                className='element-block template-text'
                                placeholder='template'
                                style={{ minHeight: 110 }}
                                value={state.template}
                                onChange={handleTemplateChange}
                                error={templateError}
                            />
                        }
                    />
                </div>
            </Card.Content>
        </Card>
    );
});
