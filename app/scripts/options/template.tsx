import React, { useState, useMemo, forwardRef, useImperativeHandle, useCallback, useEffect, useRef } from 'react';

import { Input, Form, Radio, Button, Icon, Card, Transition, Popup } from 'semantic-ui-react'

import { Template as TemplateState } from '../template';

import './template.css';

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

    const handleScopeChange = useCallback((e, { value }) => setState(current => current.withEnableContexts(value)), []);
    const handleNameChange  = useCallback((e, { value }) => setState(current => current.withName(value)), []);

    const tryUpdateTemplate = (currentState: TemplateState, template: string) => {
        const newState = currentState.withTemplate(template);
        const result = newState.validate();
        if (result instanceof Error) {
            setTemplateError(result.message);
        } else {
            setTemplateError(null);
        }
        return newState;
    };

    const handleTemplateChange = useCallback((e, { value }) => setState(current => tryUpdateTemplate(current, value)),[]);

    return (
        <Card id={`template-${props.state.id}}`} fluid onMouseEnter={() => setShowRemove(true)} onMouseLeave={() => setShowRemove(false)}>
            <Card.Content>
                <div className='element-block'>
                    <Input size='small' placeholder='template name' ref={nameInputRef} value={state.name} onChange={handleNameChange} />
                    <span className='element-inline'>context:</span>
                    <Radio
                        className='element-inline'
                        label='page'
                        name={scopeInputName}
                        value='page'
                        checked={state.enableContexts.some(c => c === 'page')}
                        onChange={handleScopeChange}
                    />
                    <Radio
                        className='element-inline'
                        label='selection'
                        name={scopeInputName}
                        value='selection'
                        checked={state.enableContexts.some(c => c === 'selection')}
                        onChange={handleScopeChange}
                    />
                    <Transition visible={showRemove} animation='fade' duration={200}>
                        <Button icon labelPosition='left' size='tiny' onClick={remove} floated='right'>
                            <Icon name='trash' />
                            Remove
                        </Button>
                    </Transition>
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
