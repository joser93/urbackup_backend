import { FormEvent, Suspense, useState } from 'react';
import { router, state, urbackupServer } from '../App';
import { Field } from "@fluentui/react-components/unstable";
import { Button, Input, Label, Spinner } from '@fluentui/react-components';
import { useQuery } from 'react-query';
import { PasswordWrongError, UsernameNotFoundError, UsernameOrPasswordWrongError } from '../api/urbackupserver';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [usernameValidationMessage, setUsernameValidationMessage] = useState("");
  const [passwordValidationMessage, setPasswordValidationMessage] = useState("");

  const anonymousLoginResult = useQuery("anonymousLogin", urbackupServer.anonymousLogin,
    {suspense: true, onSuccess(data) {
    if(data.success)
    {
      state.loggedIn = true;
      router.navigate("/status");
      return;
    }
  },});

  const handleSubmitInt = async (e : FormEvent<HTMLFormElement>) => {
    
    const initres = anonymousLoginResult.data;
    if(typeof initres == "undefined")
      throw TypeError;

    if(!username)
    {
      setUsernameValidationMessage("Username is empty");
      return;
    }
    
    try
    {
      const loginRes = await urbackupServer.login(username, password, initres.ldap_enabled ?? false);
      if(loginRes.success)
      {
        state.loggedIn = true;
        router.navigate("/status");
        return;
      }
    }
    catch(e)
    {
      if(e instanceof UsernameNotFoundError)
      {
        setUsernameValidationMessage("User not found on server");
      }
      else if(e instanceof UsernameOrPasswordWrongError)
      {
        setUsernameValidationMessage("Login with username and password combination failed");
        setPasswordValidationMessage("Login with username and password combination failed");
      }
      else if(e instanceof PasswordWrongError)
      {
        setPasswordValidationMessage("Password wrong");
      }
      else
      {
        throw e;
      }
    }
  };

  const handleSubmit = async (e : FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try
    {
      await handleSubmitInt(e);
    }
    finally
    {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%"
      }}>
    <Suspense fallback={<Spinner/>}>
      <div>
        <h3>Login:</h3>
        <div>
          <form onSubmit={handleSubmit}>
            <Field
              label="Username" required validationMessage={usernameValidationMessage}>
                <Input  id='username' value={username}  onChange={(e) => { setUsername(e.target.value)}}/>
              </Field>
              <Field
              label="Password" required validationMessage={passwordValidationMessage}>
                <Input id='password' type='password' value={password} onChange={(e) => { setPassword(e.target.value)}}/>
              </Field>
              {isLoading && <Spinner label="Logging in..." />}
              {!isLoading && <Button type="submit">Log in</Button>}
          </form>
        </div>
      </div>
    </Suspense>
    </div>
  );
};

export default Login;
